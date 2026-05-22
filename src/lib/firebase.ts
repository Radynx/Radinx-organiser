import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredConfigValues = Object.values(firebaseConfig)

export const isFirebaseConfigured = requiredConfigValues.every(
  (value) => typeof value === 'string' && value.trim().length > 0,
)

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? initializeApp(firebaseConfig)
  : null

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null

export const assertFirebase = () => {
  if (!auth || !db || !storage) {
    throw new Error(
      'Firebase non configurato. Completa le variabili VITE_FIREBASE_* nel file .env.',
    )
  }

  return { auth, db, storage }
}

export const assertFirestore = () => {
  if (!db) {
    throw new Error(
      'Firestore non configurato. Completa le variabili VITE_FIREBASE_* nel file .env.',
    )
  }

  return db
}
