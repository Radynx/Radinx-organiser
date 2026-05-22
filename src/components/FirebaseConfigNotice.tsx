import { KeyRound } from 'lucide-react'
import { isFirebaseConfigured } from '@/lib/firebase'

export function FirebaseConfigNotice() {
  if (isFirebaseConfigured) return null

  return (
    <div className="config-notice" role="alert">
      <KeyRound size={20} aria-hidden="true" />
      <div>
        <strong>Firebase non è ancora configurato</strong>
        <p>
          Crea un file <code>.env</code> partendo da <code>.env.example</code> e
          inserisci le credenziali del tuo progetto Firebase.
        </p>
      </div>
    </div>
  )
}
