import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth'
import { onSnapshot, setDoc } from 'firebase/firestore'
import { auth, assertFirebase, isFirebaseConfigured } from '@/lib/firebase'
import { userDocRef, userSettingsRef } from '@/lib/firestorePaths'
import { defaultSettings } from '@/features/settings/defaultSettings'
import type { AuthUser, UserProfile } from '@/types/domain'
import { normalizeEmail, sanitizeText } from '@/utils/sanitize'
import { profilePhotoFileToDataUrl } from '@/utils/file'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  register: (input: RegisterInput) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  updateAccountEmail: (email: string) => Promise<void>
  changePassword: (password: string) => Promise<void>
  uploadProfilePhoto: (file: File) => Promise<void>
  deleteProfilePhoto: () => Promise<void>
}

interface RegisterInput {
  email: string
  password: string
  displayName: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const resolvePhotoURL = (firebaseUser: User, profile?: Partial<UserProfile>) => {
  if (profile && 'photoURL' in profile) {
    return profile.photoURL ?? undefined
  }

  return firebaseUser.photoURL ?? undefined
}

const toAuthUser = (firebaseUser: User, profile?: Partial<UserProfile>): AuthUser => ({
  uid: firebaseUser.uid,
  email: profile?.email ?? firebaseUser.email ?? '',
  displayName: profile?.displayName ?? firebaseUser.displayName ?? 'Utente Radynx',
  photoURL: resolvePhotoURL(firebaseUser, profile),
})

const ensureCurrentUser = (currentUser: User | null) => {
  if (!currentUser) {
    throw new Error('Sessione non valida. Effettua nuovamente il login.')
  }

  return currentUser
}

const upsertProfile = async (firebaseUser: User, displayName?: string, photoURL?: string | null) => {
  const now = new Date().toISOString()
  const profile: Omit<UserProfile, 'photoURL'> & { photoURL?: string | null } = {
    uid: firebaseUser.uid,
    displayName: displayName ?? firebaseUser.displayName ?? 'Utente Radynx',
    email: firebaseUser.email ?? '',
    createdAt: firebaseUser.metadata?.creationTime ?? now,
    updatedAt: now,
  }

  if (photoURL !== undefined) {
    profile.photoURL = photoURL
  }

  await setDoc(userDocRef(firebaseUser.uid), profile, { merge: true })
  await setDoc(userSettingsRef(firebaseUser.uid), { ...defaultSettings, updatedAt: now }, { merge: true })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toAuthUser(firebaseUser) : null)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!auth || !user?.uid) {
      return undefined
    }

    const currentUser = auth.currentUser

    if (!currentUser) {
      return undefined
    }

    return onSnapshot(
      userDocRef(user.uid),
      (snapshot) => {
        const profile = snapshot.exists() ? (snapshot.data() as Partial<UserProfile>) : undefined
        setUser(toAuthUser(currentUser, profile))
      },
      () => undefined,
    )
  }, [user?.uid])

  const register = useCallback(async ({ email, password, displayName }: RegisterInput) => {
    const { auth: firebaseAuth } = assertFirebase()
    const cleanName = sanitizeText(displayName, 80)
    const credentials = await createUserWithEmailAndPassword(
      firebaseAuth,
      normalizeEmail(email),
      password,
    )

    await updateProfile(credentials.user, { displayName: cleanName })
    await upsertProfile(credentials.user, cleanName, null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { auth: firebaseAuth } = assertFirebase()
    const credentials = await signInWithEmailAndPassword(firebaseAuth, normalizeEmail(email), password)
    await upsertProfile(credentials.user)
  }, [])

  const logout = useCallback(async () => {
    const { auth: firebaseAuth } = assertFirebase()
    await signOut(firebaseAuth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { auth: firebaseAuth } = assertFirebase()
    await sendPasswordResetEmail(firebaseAuth, normalizeEmail(email))
  }, [])

  const updateDisplayName = useCallback(async (displayName: string) => {
    const { auth: firebaseAuth } = assertFirebase()
    const currentUser = ensureCurrentUser(firebaseAuth.currentUser)
    const cleanName = sanitizeText(displayName, 80)
    await updateProfile(currentUser, { displayName: cleanName })
    await setDoc(
      userDocRef(currentUser.uid),
      { displayName: cleanName, updatedAt: new Date().toISOString() },
      { merge: true },
    )
    setUser({
      uid: currentUser.uid,
      email: currentUser.email ?? '',
      displayName: cleanName,
      photoURL: user?.photoURL,
    })
  }, [user?.photoURL])

  const updateAccountEmail = useCallback(async (email: string) => {
    const { auth: firebaseAuth } = assertFirebase()
    const currentUser = ensureCurrentUser(firebaseAuth.currentUser)
    const cleanEmail = normalizeEmail(email)
    await verifyBeforeUpdateEmail(currentUser, cleanEmail)
    await setDoc(
      userDocRef(currentUser.uid),
      { pendingEmail: cleanEmail, updatedAt: new Date().toISOString() },
      { merge: true },
    )
  }, [])

  const changePassword = useCallback(async (password: string) => {
    const { auth: firebaseAuth } = assertFirebase()
    const currentUser = ensureCurrentUser(firebaseAuth.currentUser)
    await updatePassword(currentUser, password)
  }, [])

  const uploadProfilePhoto = useCallback(async (file: File) => {
    const photoURL = await profilePhotoFileToDataUrl(file)
    const { auth: firebaseAuth } = assertFirebase()
    const currentUser = ensureCurrentUser(firebaseAuth.currentUser)
    await setDoc(
      userDocRef(currentUser.uid),
      { photoURL, updatedAt: new Date().toISOString() },
      { merge: true },
    )
    setUser({
      uid: currentUser.uid,
      email: currentUser.email ?? '',
      displayName: currentUser.displayName ?? 'Utente Radynx',
      photoURL,
    })
  }, [])

  const deleteProfilePhoto = useCallback(async () => {
    const { auth: firebaseAuth } = assertFirebase()
    const currentUser = ensureCurrentUser(firebaseAuth.currentUser)
    await updateProfile(currentUser, { photoURL: null })
    await setDoc(
      userDocRef(currentUser.uid),
      { photoURL: null, updatedAt: new Date().toISOString() },
      { merge: true },
    )
    setUser({
      uid: currentUser.uid,
      email: currentUser.email ?? '',
      displayName: currentUser.displayName ?? 'Utente Radynx',
      photoURL: undefined,
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      register,
      login,
      logout,
      resetPassword,
      updateDisplayName,
      updateAccountEmail,
      changePassword,
      uploadProfilePhoto,
      deleteProfilePhoto,
    }),
    [
      user,
      loading,
      register,
      login,
      logout,
      resetPassword,
      updateDisplayName,
      updateAccountEmail,
      changePassword,
      uploadProfilePhoto,
      deleteProfilePhoto,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider.')
  }

  return context
}
