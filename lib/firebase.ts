'use client'

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const

let analyticsPromise: Promise<Analytics | null> | null = null

export function initializeFirebase() {
  const hasRequiredConfig = requiredConfigKeys.every(
    (key) => Boolean(firebaseConfig[key])
  )

  if (!hasRequiredConfig) {
    return { app: null, analytics: null }
  }

  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: firebaseConfig.apiKey as string,
        authDomain: firebaseConfig.authDomain as string,
        projectId: firebaseConfig.projectId as string,
        storageBucket: firebaseConfig.storageBucket as string,
        messagingSenderId: firebaseConfig.messagingSenderId as string,
        appId: firebaseConfig.appId as string,
      })

  try {
    // Small runtime hint for debugging in the browser console
    // (will only run on the client because this is a client module)
    // eslint-disable-next-line no-console
    console.info('Firebase initialized:', { name: app?.name, projectId: firebaseConfig.projectId })
  } catch {}

  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => {
      if (!supported || !firebaseConfig.measurementId) {
        return null
      }

      const analytics = getAnalytics(app)
      try {
        // eslint-disable-next-line no-console
        console.info('Firebase Analytics enabled')
      } catch {}
      return analytics
    })
  }

  return { app, analytics: analyticsPromise }
}