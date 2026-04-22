import mongoose from 'mongoose'

function getMongoUri() {
  const mongodbUri = process.env.MONGODB_URI

  if (!mongodbUri) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  return mongodbUri
}

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache
}

const cached = globalForMongoose.mongooseCache ?? { conn: null, promise: null }

globalForMongoose.mongooseCache = cached

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const dbName = process.env.MONGODB_DB

    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      ...(dbName ? { dbName } : {}),
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
