import { FirebaseError } from 'firebase/app'

const firebaseMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Questa email è già registrata.',
  'auth/invalid-credential': 'Credenziali non valide.',
  'auth/invalid-email': 'Email non valida.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
  'auth/user-not-found': 'Nessun account trovato con questa email.',
  'auth/weak-password': 'La password deve essere più sicura.',
  'auth/requires-recent-login': 'Per sicurezza devi effettuare di nuovo il login.',
  'permission-denied':
    'Permessi insufficienti su Firebase. Verifica che Firestore abbia le regole del repository pubblicate.',
  'failed-precondition':
    'Firestore richiede una configurazione non ancora disponibile. Aggiorna la pagina; se il problema resta, pubblica le regole Firestore aggiornate.',
  unavailable: 'Servizio temporaneamente non disponibile.',
}

export const toUserMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    return firebaseMessages[error.code] ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Si è verificato un errore inatteso.'
}
