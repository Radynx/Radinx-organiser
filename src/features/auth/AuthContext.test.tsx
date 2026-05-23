import { act, render, waitFor } from '@testing-library/react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { onSnapshot, setDoc } from 'firebase/firestore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { profilePhotoFileToDataUrl } from '@/utils/file'

const { fakeAuth, fakeUser } = vi.hoisted(() => {
  const user = {
    uid: 'user-1',
    email: 'person@example.com',
    displayName: 'Radinx User',
    photoURL: null,
  }

  return {
    fakeAuth: {
      currentUser: user,
    },
    fakeUser: user,
  }
})

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null)
    return vi.fn()
  }),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: fakeAuth,
  assertFirebase: vi.fn(() => ({ auth: fakeAuth, db: {} })),
  isFirebaseConfigured: true,
}))

vi.mock('@/lib/firestorePaths', () => ({
  userDocRef: vi.fn((userId: string) => ({ path: `users/${userId}` })),
  userSettingsRef: vi.fn((userId: string) => ({ path: `users/${userId}/settings/preferences` })),
}))

vi.mock('@/utils/file', () => ({
  profilePhotoFileToDataUrl: vi.fn(),
}))

function renderAuthProbe() {
  let authApi: ReturnType<typeof useAuth> | undefined

  function Probe() {
    authApi = useAuth()
    return null
  }

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

  return async () => {
    await waitFor(() => expect(authApi?.loading).toBe(false))
    return authApi!
  }
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: fakeUser } as never)
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: fakeUser } as never)
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined)
    vi.mocked(signOut).mockResolvedValue(undefined)
    vi.mocked(updatePassword).mockResolvedValue(undefined)
    vi.mocked(updateProfile).mockResolvedValue(undefined)
    vi.mocked(profilePhotoFileToDataUrl).mockResolvedValue('data:image/webp;base64,avatar')
    vi.mocked(setDoc).mockResolvedValue(undefined)
    vi.mocked(onSnapshot).mockReturnValue(vi.fn())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registra un utente e crea profilo e impostazioni', async () => {
    const getAuthApi = renderAuthProbe()
    const authApi = await getAuthApi()

    await act(async () => {
      await authApi.register({
        displayName: '  New User  ',
        email: 'NEW@EXAMPLE.COM',
        password: 'Password1',
      })
    })

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(fakeAuth, 'new@example.com', 'Password1')
    expect(updateProfile).toHaveBeenCalledWith(fakeUser, { displayName: 'New User' })
    expect(setDoc).toHaveBeenCalledTimes(2)
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'users/user-1' },
      expect.objectContaining({
        displayName: 'New User',
        email: 'person@example.com',
        photoURL: null,
        uid: 'user-1',
      }),
      { merge: true },
    )
  })

  it('gestisce login, logout e reset password', async () => {
    const getAuthApi = renderAuthProbe()
    const authApi = await getAuthApi()

    await act(async () => {
      await authApi.login('PERSON@EXAMPLE.COM', 'secret')
      await authApi.resetPassword('PERSON@EXAMPLE.COM')
      await authApi.logout()
    })

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(fakeAuth, 'person@example.com', 'secret')
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(fakeAuth, 'person@example.com')
    expect(signOut).toHaveBeenCalledWith(fakeAuth)
  })

  it('cambia password e salva avatar profilo gratuito in Firestore', async () => {
    const getAuthApi = renderAuthProbe()
    const authApi = await getAuthApi()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await act(async () => {
      await authApi.changePassword('Password1')
      await authApi.uploadProfilePhoto(file)
    })

    expect(updatePassword).toHaveBeenCalledWith(fakeUser, 'Password1')
    expect(profilePhotoFileToDataUrl).toHaveBeenCalledWith(file)
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'users/user-1' },
      expect.objectContaining({
        photoURL: 'data:image/webp;base64,avatar',
      }),
      { merge: true },
    )
  })
})
