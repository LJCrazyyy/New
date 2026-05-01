import { applicationDefault, cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let firebaseApp: App | null = null
let firestoreDb: Firestore | null = null

function parseServiceAccountFromEnv() {
  const jsonValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()

  if (jsonValue) {
    const parsedValue = JSON.parse(jsonValue) as ServiceAccount & { private_key?: string }

    if (typeof parsedValue.private_key === 'string') {
      parsedValue.private_key = parsedValue.private_key.replace(/\\n/g, '\n')
    }

    return parsedValue
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount
  }

  return null
}

export function getFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp
  }

  const existingApps = getApps()

  if (existingApps.length > 0) {
    firebaseApp = existingApps[0] ?? null
    return firebaseApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const serviceAccount = parseServiceAccountFromEnv()

  firebaseApp = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    ...(projectId ? { projectId } : {}),
  })

  return firebaseApp
}

export function getFirestoreDb() {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getFirebaseApp())
  }

  return firestoreDb
}