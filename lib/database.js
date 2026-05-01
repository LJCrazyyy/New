const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

function parseServiceAccountFromEnv() {
  const jsonValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()

  if (jsonValue) {
    const parsedValue = JSON.parse(jsonValue)

    if (typeof parsedValue.private_key === 'string') {
      parsedValue.private_key = parsedValue.private_key.replace(/\\n/g, '\n')
    }

    return parsedValue
  }

  const projectId = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_CLIENT_EMAIL.trim()
  const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    }
  }

  return null
}

function getFirebaseApp() {
  const existingApps = getApps()

  if (existingApps.length > 0) {
    return existingApps[0] ?? null
  }

  const projectId = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID.trim()
  const serviceAccount = parseServiceAccountFromEnv()

  return initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    ...(projectId ? { projectId } : {}),
  })
}

function getFirestoreDb() {
  return getFirestore(getFirebaseApp())
}

async function connectToDatabase() {
  return getFirestoreDb()
}

module.exports = {
  connectToDatabase,
  getDatabase: getFirestoreDb,
  getFirebaseApp,
  getFirestoreDb,
}