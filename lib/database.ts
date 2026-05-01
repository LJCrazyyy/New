declare global {
  // eslint-disable-next-line no-var
  var firebaseDatabaseCache: unknown | undefined
}

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseDatabaseCache?: unknown
}

export async function connectToDatabase() {
  if (globalForFirebase.firebaseDatabaseCache) {
    return globalForFirebase.firebaseDatabaseCache
  }

  const { getFirestoreDb } = await import('./firebase')
  const database = getFirestoreDb()
  globalForFirebase.firebaseDatabaseCache = database

  return database
}

export { getFirestoreDb as getDatabase } from './firebase'