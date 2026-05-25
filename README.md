# Radynx Organizer

Radynx Organizer è una web app per organizzare vita quotidiana, calendario personale, task lavorative e storico delle attività completate. Il progetto è costruito come SPA React con Firebase per autenticazione, Firestore e persistenza per singolo utente, senza Firebase Storage obbligatorio.

## Funzionalità

- Dashboard con panoramica giornata, prossimi impegni, task aperte, storico recente e stato calendari.
- Calendario con viste giorno, settimana e mese, filtri, categorie, priorità, note e drag & drop tra date.
- Task lavorative con stato, priorità, scadenza opzionale, note, modifica, eliminazione e completamento.
- Sezione “Cose fatte” con data/ora creazione, data/ora completamento, tempo trascorso e filtri.
- Autenticazione Firebase con registrazione, login, logout e recupero password.
- Impostazioni profilo, cambio email con verifica, cambio password e avatar compresso salvato su Firestore.
- Personalizzazione colori calendario con salvataggio su Firestore.
- Connessioni Google Calendar e Apple Calendar predisposte solo con consenso manuale.
- UI responsive, dark mode, toast, modali, empty state, loading state e fallback d’errore.

## Stack

- React + TypeScript
- Vite
- React Router
- Firebase Auth e Firestore
- React Hook Form + Zod
- date-fns
- lucide-react
- Vitest + Testing Library
- ESLint

## Struttura

```text
src/
  components/          Componenti UI riutilizzabili
  contexts/            Auth e toast provider
  features/
    auth/              Login, registrazione, reset password
    calendar/          Eventi, calendario e servizi Firestore
    completed/         Storico attività completate
    dashboard/         Panoramica principale
    settings/          Profilo, colori, sicurezza, calendari esterni
    tasks/             Task lavorative e completamento
  lib/                 Firebase, error mapping, path Firestore
  routes/              Layout e route guard
  types/               Tipi dominio
  utils/               Date, sanitizzazione, label e file validation
```

## Requisiti

- Node.js 22 o superiore
- pnpm
- Progetto Firebase con Auth e Firestore abilitati

## Installazione

```bash
pnpm install
cp .env.example .env
```

Compila `.env` con i valori del tuo progetto Firebase.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_CALENDAR_CLIENT_ID=
```

Per GitHub Pages aggiungi gli stessi nomi come repository variables in:

```text
Settings > Secrets and variables > Actions > Variables
```

La configurazione client Firebase non è una secret server-side; è normale che venga inclusa nel bundle frontend. Le regole Firestore proteggono i dati reali.

## Avvio

```bash
pnpm dev
```

Link GitHub Pages:

```text
https://radynx.github.io/Radinx-organiser/
```

Build produzione:

```bash
pnpm build
pnpm preview
```

## Test e qualità

```bash
pnpm lint
pnpm test
```

La suite copre validazioni auth, registrazione, login, logout, reset password, avatar profilo, route protette, creazione/modifica/eliminazione eventi, creazione/completamento task, impostazioni colori e flag calendari.

## Firebase

### Auth

Abilita Email/Password in Firebase Authentication.

### Firestore

La struttura dati è scoped per utente:

```text
users/{userId}
users/{userId}/events/{eventId}
users/{userId}/tasks/{taskId}
users/{userId}/completedTasks/{taskId}
users/{userId}/settings/preferences
```

Ogni utente legge e scrive solo i propri documenti. Le regole sono in `firestore.rules`.
Le schermate ordinano gli eventi lato client, quindi non servono indici compositi manuali per il calendario.

Deploy regole:

```bash
firebase deploy --only firestore:rules
```

### Avatar profilo senza Storage

Per mantenere il progetto sul piano gratuito, l'app non usa Firebase Storage. L'immagine profilo viene validata, ridimensionata nel browser e salvata come piccolo data URL nel documento:

```text
users/{userId}
```

Sono ammessi JPG, PNG e WebP sotto 3 MB; prima del salvataggio l'avatar viene compresso a dimensione ridotta per restare entro i limiti di Firestore.

## Google Calendar

La connessione non parte mai automaticamente. L’utente deve aprire Impostazioni e premere “Connetti”.

Per abilitare l’accesso con account Google:

1. Crea un OAuth Client ID in Google Cloud Console.
2. Usa il tipo “Applicazione web”.
3. Aggiungi gli origin autorizzati:
   - `https://radynx.github.io`
   - `http://localhost:5174` per sviluppo locale
4. Abilita la Google Calendar API nel progetto Google Cloud.
5. Inserisci il Client ID in `VITE_GOOGLE_CALENDAR_CLIENT_ID`.

L’app usa Google Identity Services nel browser per aprire la finestra ufficiale Google e ottenere un access token solo dopo click esplicito dell’utente. Il token non viene salvato in Firestore.

Per GitHub Pages aggiungi `VITE_GOOGLE_CALENDAR_CLIENT_ID` in:

```text
GitHub > Settings > Secrets and variables > Actions > Variables
```

Senza questa variabile, l’app mostra “Da configurare” e non effettua chiamate API.

## Apple Calendar

Apple Calendar non offre un flusso browser equivalente a Google OAuth per CalDAV personale. Per una sync reale serve un backend sicuro che gestisca CalDAV e credenziali/app-specific password fuori dal client.

Ogni utente deve usare la propria password specifica per app Apple, ma quella password non deve mai essere inserita nella web app statica o salvata da codice frontend. Va usata solo in un backend privato con storage cifrato e consenso esplicito.

Se una password specifica per app è stata condivisa accidentalmente, revocala dall’Apple Account e generane una nuova.

Questa parte resta predisposta ma non viene attivata automaticamente.

L’app espone già flag manuale, stato, messaggi d’errore e disconnessione. Se il flag è disattivato non vengono eseguite chiamate, letture o scritture esterne.

## Deploy GitHub Pages

Il workflow `.github/workflows/deploy-pages.yml` pubblica automaticamente ogni push su `main`.

Per lanciare manualmente un nuovo deploy:

```text
GitHub > Actions > Deploy GitHub Pages > Run workflow
```

## Deploy Firebase Hosting

```bash
pnpm build
firebase deploy --only hosting
```

`firebase.json` include rewrite verso `index.html` per supportare React Router in produzione.

## Sicurezza

- Nessuna chiave Firebase è hardcoded.
- Nessuna sincronizzazione calendario esterna è automatica.
- Input validati con Zod e sanitizzazione lato client.
- Route private protette da auth guard.
- Le Firestore rules limitano ogni utente ai propri dati.
- Operazioni distruttive usano modali di conferma.

## Roadmap futura

- Sync Google Calendar completa tramite OAuth e backend sicuro opzionale.
- Sync Apple Calendar tramite backend CalDAV.
- Notifiche push opzionali.
- Export CSV/ICS.
- Ricorrenze evento.
- Offline cache avanzata.
