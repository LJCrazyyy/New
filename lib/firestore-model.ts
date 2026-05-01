import { randomUUID } from 'node:crypto'
import { getFirestoreDb } from './firebase'

type FirestoreValue = Record<string, any>

type PopulateItem =
  | string
  | {
      path: string
      select?: string
      populate?: PopulateSpec
    }

export type PopulateSpec = PopulateItem | PopulateItem[]

type RelationConfig = {
  model: () => FirestoreModel<any>
  many?: boolean
}

type FirestoreModelOptions = {
  modelName: string
  collectionName: string
  relations?: Record<string, RelationConfig>
  uniqueFields?: string[][]
  dateFields?: string[]
}

type QueryMode = 'many' | 'one' | 'byId'

type UpdateOptions = {
  new?: boolean
  runValidators?: boolean
  upsert?: boolean
}

type BulkWriteOperation = {
  updateOne?: {
    filter?: FirestoreValue
    update?: FirestoreValue
    upsert?: boolean
  }
}

const modelRegistry = new Map<string, FirestoreModel<any>>()

// Simple in-memory cache to avoid repeated full collection reads.
// Cache entries live for a short TTL (ms) to keep dev server responsive.
const collectionSnapshotCache = new Map<string, { ts: number; records: FirestoreValue[] }>()
const COLLECTION_CACHE_TTL = 5_000 // 5 seconds

function isPlainObject(value: unknown): value is FirestoreValue {
  return Boolean(value) && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)])) as T
  }

  return value
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T
  }

  if (value instanceof Date) {
    return value
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)])
    ) as T
  }

  return value
}

function normalizeStoredValue(value: any): any {
  if (value == null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeStoredValue(item))
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate()
  }

  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeStoredValue(entry)]))
  }

  return value
}

function getFieldValue(record: FirestoreValue, path: string) {
  if (path === '_id' || path === 'id') {
    return record._id ?? record.id
  }

  return path.split('.').reduce<any>((current, key) => {
    if (current == null) {
      return undefined
    }

    return current[key]
  }, record)
}

function setFieldValue(record: FirestoreValue, path: string, value: any) {
  const keys = path.split('.')
  const lastKey = keys.pop()

  if (!lastKey) {
    return
  }

  let current: any = record

  for (const key of keys) {
    if (!isPlainObject(current[key])) {
      current[key] = {}
    }

    current = current[key]
  }

  current[lastKey] = value
}

function normalizeComparable(value: any): any {
  if (value == null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparable(item))
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime()
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  if (isPlainObject(value)) {
    return getDocumentId(value) ?? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeComparable(entry)]))
  }

  return value
}

function getDocumentId(record: FirestoreValue) {
  return typeof record.id === 'string'
    ? record.id
    : typeof record._id === 'string'
      ? record._id
      : typeof record._id?.toString === 'function'
        ? record._id.toString()
        : undefined
}

function asStringId(value: any) {
  if (value == null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value?.toString === 'function') {
    return value.toString()
  }

  return String(value)
}

function matchesCondition(fieldValue: any, condition: any): boolean {
  if (condition instanceof RegExp) {
    return condition.test(String(fieldValue ?? ''))
  }

  if (isPlainObject(condition)) {
    if ('$in' in condition) {
      const candidates = Array.isArray(condition.$in) ? condition.$in : []
      const normalizedValue = normalizeComparable(fieldValue)

      return candidates.some((candidate) => normalizeComparable(candidate) === normalizedValue)
    }

    if ('$ne' in condition) {
      return normalizeComparable(fieldValue) !== normalizeComparable(condition.$ne)
    }

    if ('$gt' in condition) {
      return Number(normalizeComparable(fieldValue)) > Number(normalizeComparable(condition.$gt))
    }

    if ('$gte' in condition) {
      return Number(normalizeComparable(fieldValue)) >= Number(normalizeComparable(condition.$gte))
    }

    if ('$lt' in condition) {
      return Number(normalizeComparable(fieldValue)) < Number(normalizeComparable(condition.$lt))
    }

    if ('$lte' in condition) {
      return Number(normalizeComparable(fieldValue)) <= Number(normalizeComparable(condition.$lte))
    }

    if ('$regex' in condition) {
      const flags = typeof condition.$options === 'string' ? condition.$options : ''
      const regex = condition.$regex instanceof RegExp ? condition.$regex : new RegExp(String(condition.$regex ?? ''), flags)
      return regex.test(String(fieldValue ?? ''))
    }
  }

  if (Array.isArray(condition)) {
    return condition.some((item) => matchesCondition(fieldValue, item))
  }

  if (condition === null) {
    return fieldValue == null
  }

  return normalizeComparable(fieldValue) === normalizeComparable(condition)
}

function matchesFilter(record: FirestoreValue, filter: FirestoreValue): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') {
      return Array.isArray(condition) && condition.some((entry) => matchesFilter(record, entry as FirestoreValue))
    }

    const fieldValue = getFieldValue(record, key)
    return matchesCondition(fieldValue, condition)
  })
}

function parseSelectFields(select?: string) {
  if (!select) {
    return null
  }

  const fields = select
    .split(/\s+/)
    .map((field) => field.trim())
    .filter(Boolean)

  if (fields.length === 0) {
    return null
  }

  const exclusions = fields.filter((field) => field.startsWith('-')).map((field) => field.slice(1))

  if (exclusions.length > 0) {
    return { mode: 'exclude' as const, fields: exclusions }
  }

  return { mode: 'include' as const, fields }
}

function applySelection(record: FirestoreValue, select?: string) {
  const selection = parseSelectFields(select)

  if (!selection) {
    return cloneValue(record)
  }

  if (selection.mode === 'exclude') {
    const nextRecord = cloneValue(record)

    for (const field of selection.fields) {
      delete nextRecord[field]
    }

    return nextRecord
  }

  const nextRecord: FirestoreValue = {
    id: record.id,
    _id: record._id,
  }

  for (const field of selection.fields) {
    if (field === 'id' || field === '_id') {
      continue
    }

    const fieldValue = getFieldValue(record, field)
    if (fieldValue !== undefined) {
      setFieldValue(nextRecord, field, cloneValue(fieldValue))
    }
  }

  return nextRecord
}

function applySort(records: FirestoreValue[], sortSpec: any) {
  if (!sortSpec) {
    return records
  }

  const entries = typeof sortSpec === 'string'
    ? [[sortSpec.startsWith('-') ? sortSpec.slice(1) : sortSpec, sortSpec.startsWith('-') ? -1 : 1]] as Array<[string, number]>
    : Object.entries(sortSpec).map(([field, direction]) => [field, Number(direction) < 0 ? -1 : 1] as [string, number])

  return [...records].sort((left, right) => {
    for (const [field, direction] of entries) {
      const leftValue = normalizeComparable(getFieldValue(left, field))
      const rightValue = normalizeComparable(getFieldValue(right, field))

      if (leftValue < rightValue) {
        return -1 * direction
      }

      if (leftValue > rightValue) {
        return 1 * direction
      }
    }

    return 0
  })
}

function convertUpdateDocument(update: FirestoreValue, dateFields: string[]) {
  if (!isPlainObject(update)) {
    return update
  }

  const nextUpdate = cloneValue(update)

  const applyDateFields = (target: FirestoreValue) => {
    for (const field of dateFields) {
      const fieldValue = target[field]

      if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
        const parsedDate = new Date(fieldValue)
        if (!Number.isNaN(parsedDate.getTime())) {
          target[field] = parsedDate
        }
      }
    }
  }

  if ('$set' in nextUpdate && isPlainObject(nextUpdate.$set)) {
    applyDateFields(nextUpdate.$set)
  }

  if ('$setOnInsert' in nextUpdate && isPlainObject(nextUpdate.$setOnInsert)) {
    applyDateFields(nextUpdate.$setOnInsert)
  }

  applyDateFields(nextUpdate)

  return nextUpdate
}

function computeUpdatePayload(update: FirestoreValue) {
  if (!isPlainObject(update)) {
    return { direct: cloneValue(update), setOnInsert: null }
  }

  const direct = isPlainObject(update.$set) ? cloneValue(update.$set) : { ...cloneValue(update) }
  delete direct.$set
  delete direct.$setOnInsert

  const setOnInsert = isPlainObject(update.$setOnInsert) ? cloneValue(update.$setOnInsert) : null

  return { direct, setOnInsert }
}

function buildDocumentData(id: string, data: FirestoreValue, dateFields: string[]) {
  const now = new Date()
  const normalizedData = stripUndefined(cloneValue(data)) as FirestoreValue
  const nextRecord: FirestoreValue = {
    ...normalizedData,
    id,
    _id: id,
    createdAt: normalizedData.createdAt ?? now,
    updatedAt: now,
  }

  for (const field of dateFields) {
    const fieldValue = nextRecord[field]

    if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
      const parsedDate = new Date(fieldValue)
      if (!Number.isNaN(parsedDate.getTime())) {
        nextRecord[field] = parsedDate
      }
    }
  }

  return nextRecord
}

function applyAccumulator(current: FirestoreValue, fieldName: string, accumulator: FirestoreValue, record: FirestoreValue) {
  if ('$sum' in accumulator) {
    const sumValue = accumulator.$sum
    const currentValue = Number(current[fieldName] ?? 0)
    const delta = typeof sumValue === 'number'
      ? sumValue
      : Number(normalizeComparable(getFieldValue(record, String(sumValue).replace(/^\$/, ''))))

    current[fieldName] = currentValue + (Number.isFinite(delta) ? delta : 0)
    return
  }

  if ('$avg' in accumulator) {
    const sourceField = String(accumulator.$avg).replace(/^\$/, '')
    const nextValue = Number(normalizeComparable(getFieldValue(record, sourceField)))
    const state = current[fieldName] ?? { total: 0, count: 0 }

    state.total += Number.isFinite(nextValue) ? nextValue : 0
    state.count += 1
    current[fieldName] = state
  }
}

function finalizeGroupRecord(record: FirestoreValue) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (value && typeof value === 'object' && 'total' in value && 'count' in value) {
        return [key, value.count > 0 ? value.total / value.count : 0]
      }

      return [key, value]
    })
  )
}

function buildGroupKey(groupIdSpec: any, record: FirestoreValue) {
  if (groupIdSpec == null) {
    return 'null'
  }

  if (typeof groupIdSpec === 'string') {
    return JSON.stringify(normalizeComparable(getFieldValue(record, groupIdSpec.replace(/^\$/, ''))))
  }

  if (isPlainObject(groupIdSpec)) {
    const nextValue: FirestoreValue = {}

    for (const [key, source] of Object.entries(groupIdSpec)) {
      nextValue[key] = normalizeComparable(getFieldValue(record, String(source).replace(/^\$/, '')))
    }

    return JSON.stringify(nextValue)
  }

  return JSON.stringify(groupIdSpec)
}

class FirestoreQuery<T> {
  private selectClause: string | null = null

  private sortClause: any = null

  private skipCount = 0

  private limitCount: number | null = null

  private populateConfig: PopulateItem[] = []

  private leanResult = false

  constructor(private readonly model: FirestoreModel<any>, private readonly mode: QueryMode, private readonly filter: FirestoreValue) {}

  select(selectClause: string) {
    this.selectClause = selectClause
    return this
  }

  sort(sortClause: any) {
    this.sortClause = sortClause
    return this
  }

  skip(skipCount: number) {
    this.skipCount = Math.max(0, Number(skipCount) || 0)
    return this
  }

  limit(limitCount: number) {
    this.limitCount = Math.max(0, Number(limitCount) || 0)
    return this
  }

  populate(populate: PopulateSpec, select?: string) {
    if (typeof populate === 'string') {
      this.populateConfig.push({ path: populate, select })
    } else if (Array.isArray(populate)) {
      this.populateConfig.push(...populate)
    } else {
      this.populateConfig.push(populate)
    }

    return this
  }

  lean() {
    this.leanResult = true
    return this
  }

  async exec() {
    const records = await this.model.findRecords(this.filter)
    let output = this.mode === 'one' || this.mode === 'byId' ? records.slice(0, 1) : records

    if (this.sortClause) {
      output = applySort(output, this.sortClause)
    }

    if (this.skipCount > 0) {
      output = output.slice(this.skipCount)
    }

    if (this.limitCount != null) {
      output = output.slice(0, this.limitCount)
    }

    if (this.selectClause) {
      output = output.map((record) => applySelection(record, this.selectClause!))
    }

    if (this.populateConfig.length > 0) {
      output = await this.model.populateRecords(output, this.populateConfig)
    }

    if (this.mode === 'one' || this.mode === 'byId') {
      return output[0] ?? null
    }

    return output
  }

  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) {
    return this.exec().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) {
    return this.exec().catch(onrejected)
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.exec().finally(onfinally)
  }
}

export class FirestoreModel<T extends FirestoreValue = FirestoreValue> {
  readonly modelName: string

  readonly collectionName: string

  private readonly relations: Record<string, RelationConfig>

  private readonly uniqueFields: string[][]

  private readonly dateFields: string[]

  constructor(options: FirestoreModelOptions) {
    this.modelName = options.modelName
    this.collectionName = options.collectionName
    this.relations = options.relations ?? {}
    this.uniqueFields = options.uniqueFields ?? []
    this.dateFields = options.dateFields ?? []

    modelRegistry.set(this.collectionName, this)
  }

  private get collection() {
    return getFirestoreDb().collection(this.collectionName)
  }

  private async snapshotRecords() {
    const cached = collectionSnapshotCache.get(this.collectionName)
    const now = Date.now()

    if (cached && now - cached.ts < COLLECTION_CACHE_TTL) {
      return cached.records
    }

    const snapshot = await this.collection.get()
    const records = snapshot.docs.map((doc) => this.normalizeRecord(doc.id, doc.data() as FirestoreValue))

    collectionSnapshotCache.set(this.collectionName, { ts: now, records })

    return records
  }

  private normalizeRecord(id: string, data: FirestoreValue) {
    const normalizedData = normalizeStoredValue(data) as FirestoreValue
    const nextRecord: FirestoreValue = {
      ...normalizedData,
      id,
      _id: id,
    }

    for (const field of this.dateFields) {
      const fieldValue = nextRecord[field]

      if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
        const parsedDate = new Date(fieldValue)
        if (!Number.isNaN(parsedDate.getTime())) {
          nextRecord[field] = parsedDate
        }
      }
    }

    return nextRecord
  }

  private async ensureUnique(record: FirestoreValue, ignoreId?: string) {
    if (this.uniqueFields.length === 0) {
      return
    }

    const records = await this.snapshotRecords()

    for (const uniqueGroup of this.uniqueFields) {
      const conflict = records.find((existing) => {
        if (ignoreId && getDocumentId(existing) === ignoreId) {
          return false
        }

        return uniqueGroup.every((field) => normalizeComparable(getFieldValue(existing, field)) === normalizeComparable(getFieldValue(record, field)))
      })

      if (conflict) {
        throw new Error('duplicate key error')
      }
    }
  }

  private async writeDocument(id: string, data: FirestoreValue) {
    const record = buildDocumentData(id, data, this.dateFields)
    await this.ensureUnique(record, id)
    await this.collection.doc(id).set(stripUndefined(record))
    return record
  }

  private async applyUpdate(record: FirestoreValue, update: FirestoreValue, upsert = false) {
    const targetRecord = cloneValue(record)
    const normalizedUpdate = convertUpdateDocument(update, this.dateFields) as FirestoreValue
    const { direct, setOnInsert } = computeUpdatePayload(normalizedUpdate)

    if (isPlainObject(normalizedUpdate.$set)) {
      Object.assign(targetRecord, normalizedUpdate.$set)
    }

    for (const [key, value] of Object.entries(direct)) {
      if (key.startsWith('$')) {
        continue
      }

      targetRecord[key] = value
    }

    if (upsert && isPlainObject(setOnInsert)) {
      Object.assign(targetRecord, setOnInsert)
    }

    targetRecord.updatedAt = new Date()
    return targetRecord
  }

  private async queryRecords(filter: FirestoreValue) {
    const records = await this.snapshotRecords()
    return records.filter((record) => matchesFilter(record, filter ?? {}))
  }

  async findRecords(filter: FirestoreValue) {
    return this.queryRecords(filter)
  }

  find(filter: FirestoreValue = {}) {
    return new FirestoreQuery(this, 'many', filter)
  }

  findOne(filter: FirestoreValue = {}) {
    return new FirestoreQuery(this, 'one', filter)
  }

  findById(id: string) {
    return new FirestoreQuery(this, 'byId', { _id: id })
  }

  async countDocuments(filter: FirestoreValue = {}) {
    const records = await this.queryRecords(filter)
    return records.length
  }

  async create(data: FirestoreValue | FirestoreValue[]) {
    if (Array.isArray(data)) {
      return this.insertMany(data)
    }

    const id = randomUUID()
    return this.writeDocument(id, data)
  }

  async insertMany(records: FirestoreValue[], _options?: { ordered?: boolean }) {
    const createdRecords: FirestoreValue[] = []

    for (const record of records) {
      const id = randomUUID()
      createdRecords.push(await this.writeDocument(id, record))
    }

    return createdRecords
  }

  async updateOne(filter: FirestoreValue, update: FirestoreValue, options: UpdateOptions = {}) {
    const records = await this.queryRecords(filter)
    const currentRecord = records[0]

    if (!currentRecord) {
      if (!options.upsert) {
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
      }

      const upsertRecord = await this.applyUpdate(stripUndefined({ ...filter }), update, true)
      const id = randomUUID()
      await this.writeDocument(id, upsertRecord)
      return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }
    }

    const nextRecord = await this.applyUpdate(currentRecord, update)
    const id = asStringId(currentRecord._id)
    await this.ensureUnique(nextRecord, id)
    await this.collection.doc(id).set(stripUndefined(nextRecord))

    return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 }
  }

  async updateMany(filter: FirestoreValue, update: FirestoreValue) {
    const records = await this.queryRecords(filter)
    let modifiedCount = 0

    for (const record of records) {
      const nextRecord = await this.applyUpdate(record, update)
      const id = asStringId(record._id)
      await this.ensureUnique(nextRecord, id)
      await this.collection.doc(id).set(stripUndefined(nextRecord))
      modifiedCount += 1
    }

    return { matchedCount: records.length, modifiedCount }
  }

  async findByIdAndUpdate(id: string, update: FirestoreValue, options: UpdateOptions = {}) {
    const currentRecord = await this.findById(id)
    if (!currentRecord) {
      if (!options.upsert) {
        return null
      }

      const upsertRecord = await this.applyUpdate({ _id: id, id }, update, true)
      await this.writeDocument(id, upsertRecord)
      return options.new === false ? null : this.normalizeRecord(id, upsertRecord)
    }

    const nextRecord = await this.applyUpdate(currentRecord as FirestoreValue, update)
    await this.ensureUnique(nextRecord, id)
    await this.collection.doc(id).set(stripUndefined(nextRecord))

    return options.new === false ? currentRecord : this.normalizeRecord(id, nextRecord)
  }

  async findByIdAndDelete(id: string) {
    const currentRecord = await this.findById(id)

    if (!currentRecord) {
      return null
    }

    await this.collection.doc(id).delete()
    return currentRecord
  }

  async deleteMany(filter: FirestoreValue = {}) {
    const records = await this.queryRecords(filter)

    for (const record of records) {
      await this.collection.doc(asStringId(record._id)).delete()
    }

    return { deletedCount: records.length }
  }

  async bulkWrite(operations: BulkWriteOperation[], options: { ordered?: boolean } = {}) {
    let matchedCount = 0
    let modifiedCount = 0

    for (const operation of operations) {
      if (!operation.updateOne) {
        continue
      }

      const { filter = {}, update = {}, upsert = false } = operation.updateOne
      const result = await this.updateOne(filter, update, { upsert })
      matchedCount += result.matchedCount
      modifiedCount += result.modifiedCount

      if (options.ordered === false) {
        continue
      }
    }

    return { matchedCount, modifiedCount }
  }

  async aggregate(pipeline: Array<Record<string, any>>) {
    let records = await this.snapshotRecords()

    for (const stage of pipeline) {
      if ('$match' in stage) {
        records = records.filter((record) => matchesFilter(record, stage.$match))
        continue
      }

      if ('$lookup' in stage) {
        const lookup = stage.$lookup
        const targetModel = modelRegistry.get(lookup.from)

        if (!targetModel) {
          records = records.map((record) => ({ ...record, [lookup.as]: [] }))
          continue
        }

        const targetRecords = await targetModel.snapshotRecords()
        records = records.map((record) => {
          const localValue = getFieldValue(record, lookup.localField)
          const matches = targetRecords.filter((targetRecord) => normalizeComparable(getFieldValue(targetRecord, lookup.foreignField)) === normalizeComparable(localValue))
          return { ...record, [lookup.as]: matches }
        })

        continue
      }

      if ('$unwind' in stage) {
        const unwindPath = typeof stage.$unwind === 'string' ? stage.$unwind : stage.$unwind.path
        const normalizedPath = unwindPath.replace(/^\$/, '')
        const nextRecords: FirestoreValue[] = []

        for (const record of records) {
          const value = getFieldValue(record, normalizedPath)

          if (Array.isArray(value)) {
            for (const item of value) {
              nextRecords.push({ ...record, [normalizedPath]: item })
            }
            continue
          }

          if (value != null) {
            nextRecords.push(record)
          }
        }

        records = nextRecords
        continue
      }

      if ('$group' in stage) {
        const groupSpec = stage.$group
        const grouped = new Map<string, FirestoreValue>()

        for (const record of records) {
          const groupKey = buildGroupKey(groupSpec._id, record)

          if (!grouped.has(groupKey)) {
            const initialRecord: FirestoreValue = { _id: groupSpec._id == null ? null : normalizeStoredValue(groupSpec._id) }

            if (isPlainObject(groupSpec._id)) {
              const nextId: FirestoreValue = {}

              for (const [key, source] of Object.entries(groupSpec._id)) {
                nextId[key] = normalizeComparable(getFieldValue(record, String(source).replace(/^\$/, '')))
              }

              initialRecord._id = nextId
            } else if (typeof groupSpec._id === 'string') {
              initialRecord._id = normalizeComparable(getFieldValue(record, groupSpec._id.replace(/^\$/, '')))
            }

            for (const [fieldName, accumulator] of Object.entries(groupSpec)) {
              if (fieldName === '_id') {
                continue
              }

              applyAccumulator(initialRecord, fieldName, accumulator as FirestoreValue, record)
            }

            grouped.set(groupKey, initialRecord)
            continue
          }

          const currentRecord = grouped.get(groupKey)!
          for (const [fieldName, accumulator] of Object.entries(groupSpec)) {
            if (fieldName === '_id') {
              continue
            }

            applyAccumulator(currentRecord, fieldName, accumulator as FirestoreValue, record)
          }
        }

        records = Array.from(grouped.values()).map((record) => finalizeGroupRecord(record))
        continue
      }

      if ('$sort' in stage) {
        records = applySort(records, stage.$sort)
        continue
      }

      if ('$limit' in stage) {
        records = records.slice(0, Number(stage.$limit) || 0)
      }
    }

    return records
  }

  async populate(document: any, populateConfig: PopulateSpec, select?: string) {
    const config = typeof populateConfig === 'string'
      ? [{ path: populateConfig, select }]
      : Array.isArray(populateConfig)
        ? populateConfig
        : [populateConfig]

    return this.populateRecords(document, config)
  }

  async populateRecords(document: any, populateConfig: PopulateItem[]) {
    if (document == null) {
      return document
    }

    const documents = Array.isArray(document) ? document : [document]
    const populatedDocuments = await Promise.all(documents.map((entry) => this.populateSingle(entry, populateConfig)))
    return Array.isArray(document) ? populatedDocuments : populatedDocuments[0] ?? null
  }

  private async populateSingle(document: any, populateConfig: PopulateItem[]) {
    let workingDocument = cloneValue(document)

    for (const configItem of populateConfig) {
      const population = typeof configItem === 'string' ? { path: configItem } : configItem
      const relation = this.relations[population.path]

      if (!relation) {
        continue
      }

      const relatedModel = relation.model()
      const currentValue = getFieldValue(workingDocument, population.path)

      if (Array.isArray(currentValue)) {
        const ids = currentValue.map((entry) => asStringId(entry)).filter(Boolean)
        const relatedDocuments = ids.length > 0 ? await relatedModel.find({ _id: { $in: ids } }) : []
        const relatedMap = new Map((relatedDocuments as any[]).map((entry) => [asStringId(entry._id ?? entry.id), cloneValue(entry)]))
        const populatedItems = currentValue.map((entry) => relatedMap.get(asStringId(entry)) ?? null).filter(Boolean)
        setFieldValue(workingDocument, population.path, populatedItems)
      } else {
        const relatedId = asStringId(currentValue)
        const relatedDocument = relatedId ? await relatedModel.findById(relatedId) : null
        setFieldValue(workingDocument, population.path, relatedDocument ? cloneValue(relatedDocument) : null)
      }

      if (population.select) {
        const nextValue = getFieldValue(workingDocument, population.path)

        if (Array.isArray(nextValue)) {
          setFieldValue(workingDocument, population.path, nextValue.map((entry) => applySelection(entry, population.select)))
        } else if (nextValue) {
          setFieldValue(workingDocument, population.path, applySelection(nextValue, population.select))
        }
      }

      if (population.populate) {
        const nextConfig = Array.isArray(population.populate) ? population.populate : [population.populate]
        const nextValue = getFieldValue(workingDocument, population.path)

        if (Array.isArray(nextValue)) {
          setFieldValue(
            workingDocument,
            population.path,
            await Promise.all(nextValue.map((entry) => relatedModel.populate(entry, nextConfig)))
          )
        } else if (nextValue) {
          setFieldValue(workingDocument, population.path, await relatedModel.populate(nextValue, nextConfig))
        }
      }
    }

    return workingDocument
  }
}

export function createFirestoreModel<T extends FirestoreValue>(options: FirestoreModelOptions) {
  return new FirestoreModel<T>(options)
}

export function getFirestoreModelByCollectionName(collectionName: string) {
  return modelRegistry.get(collectionName)
}