import { initializeApp, getApps, type App } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { config } from '../config/env'

export function initFirebase(): App {
  if (getApps().length > 0) return getApps()[0]

  return initializeApp({
    credential: cert({
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}
