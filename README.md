# 💰 Gestione Spese Condivise

Applicazione web per gestire le spese condivise tra più persone. Ogni utente può registrare spese, organizzarle per persona e categoria, e visualizzare riepiloghi mensili con totali e medie.

Realizzata con **Angular 21** e **Firebase Realtime Database**.

## Funzionalità

- **Login** — Autenticazione con email e password tramite Firebase Auth
- **Registra spesa** — Form con persona, importo, data, luogo, categoria e note
- **Storico** — Tabella con tutte le spese, ordinate per data, con possibilità di eliminare
- **Riepilogo** — Statistiche filtrabili per mese e anno: totale, numero spese, media, totale per persona
- **Persone** — Aggiunta e rimozione delle persone che condividono le spese
- **Categorie** — Gestione categorie (6 predefinite: Cibo, Trasporti, Intrattenimento, Alloggio, Shopping, Altro)
- **Real-time** — I dati si aggiornano in tempo reale su tutti i dispositivi
- **Multi-utente** — Ogni utente vede solo le proprie spese (isolamento per UID)
- **Responsive** — Funziona su desktop, tablet e smartphone

---

## Installazione

### Prerequisiti

- **Node.js** 18 o superiore
- **npm** 9 o superiore

### Passi

```bash
cd expense-tracker
npm install
```

### Avvio in locale (modalità mock, senza Firebase)

L'app include una modalità mock che simula Firebase in memoria. Non serve configurare nulla:

```bash
npx ng serve --open
```

Si apre su `http://localhost:4200/` con auto-login come `demo@example.com`. Utile per provare l'interfaccia.

### Avvio in locale (con Firebase reale)

Segui la sezione "Configurazione Firebase" qui sotto, poi:

```bash
npx ng serve --open
```

### Switch mock / Firebase reale

Nel file `src/environments/environment.ts`, cambia il flag `useMock`:

| Valore | Effetto |
|--------|---------|
| `useMock: true` | Dati in memoria, auto-login, nessun Firebase necessario |
| `useMock: false` | Usa Firebase reale con le credenziali configurate |

---

## Configurazione Firebase

### 1. Crea il progetto

1. Vai su **https://console.firebase.google.com/**
2. Clicca **"Aggiungi progetto"**
3. Dai un nome (es. `expense-tracker-rs`)
4. Disabilita Google Analytics → **Crea progetto**

### 2. Abilita l'autenticazione

1. Menu a sinistra → espandi **Build** → clicca **Authentication**
2. Clicca **Get started**
3. Clicca su **Email/Password** nella lista dei provider
4. Abilita il primo toggle → **Salva**

### 3. Crea il Realtime Database

1. Menu a sinistra → **Realtime Database** → **Crea database**
2. Scegli la regione **europe-west1**
3. Scegli **"Avvia in modalità bloccata"** → **Abilita**
4. Vai nel tab **Rules** e sostituisci con:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "expenses": {
          ".indexOn": ["date", "createdAt"]
        }
      }
    }
  }
}
```

5. Clicca **Pubblica**

### 4. Registra l'app web

1. Vai alla **Project Overview** (icona casa in alto a sinistra)
2. Clicca l'icona **Web** (`</>`) per aggiungere un'app
3. Dai un nickname → **Registra app**
4. Copia la configurazione mostrata

In alternativa: **⚙️ Impostazioni progetto** → scorri fino a **Le tue app** → **Configurazione SDK**.

### 5. Aggiorna environment.ts

Crea il file `src/environments/environment.ts` (è escluso da git per sicurezza) con le credenziali copiate:

```typescript
export const environment = {
  production: false,
  useMock: false,
  firebase: {
    apiKey: 'AIzaSy...',
    authDomain: 'tuo-progetto.firebaseapp.com',
    databaseURL: 'https://tuo-progetto-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'tuo-progetto',
    storageBucket: 'tuo-progetto.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123'
  }
};
```

### 6. Crea gli utenti

L'app non ha la registrazione pubblica. Per aggiungere utenti:

1. Firebase Console → **Authentication** → **Users**
2. Clicca **Add user**
3. Inserisci email e password

### 7. (Opzionale) Limita la registrazione

Per impedire che qualcuno si registri chiamando direttamente le API Firebase:

1. **Authentication** → **Settings** → **User Actions**
2. Disabilita **"Allow users to sign up"**

---

## Strutture dati

Non serve creare nulla manualmente. Il Realtime Database è schema-less: le strutture si creano automaticamente al primo inserimento.

```
users/
  {uid}/
    expenses/
      {expenseId}/
        who: string
        amount: number
        date: string (YYYY-MM-DD)
        where: string
        category: string
        notes: string
        uid: string
        createdAt: number
    people/
      {key}: string
    categories/
      {key}: string
```

---

## Build per produzione

```bash
npx ng build --configuration production
```

Output in `dist/expense-tracker/browser/`.

### Deploy su GitHub Pages

```bash
npx ng build --configuration production --base-href /expense-tracker/
```

Copia il contenuto di `dist/expense-tracker/browser/` nella cartella `docs/` del repo. Su GitHub: **Settings** → **Pages** → branch `main`, cartella `/docs`.

Ricorda di aggiungere il dominio `TUO_USERNAME.github.io` ai domini autorizzati in Firebase Console → **Authentication** → **Settings** → **Authorized domains**.

---

## Struttura progetto

```
src/app/
├── components/
│   ├── categories/        # Gestione categorie
│   ├── dashboard/         # Layout principale con 5 tab
│   ├── expense-form/      # Form registrazione spesa
│   ├── expense-list/      # Storico spese (tabella)
│   ├── login/             # Pagina di login
│   ├── overview/          # Riepilogo con filtri e statistiche
│   ├── people/            # Gestione persone
│   └── toast/             # Notifiche toast
├── guards/
│   └── auth.guard.ts      # Protezione rotte (utenti autenticati)
├── models/
│   └── expense.model.ts   # Interfaccia TypeScript
├── services/
│   ├── firebase.service.ts       # Wrapper Firebase SDK
│   ├── mock-firebase.service.ts  # Mock in memoria (dev)
│   ├── expense.service.ts        # CRUD spese
│   ├── people.service.ts         # CRUD persone
│   ├── category.service.ts       # CRUD categorie
│   └── toast.service.ts          # Notifiche
├── app.config.ts          # Configurazione providers
├── app.routes.ts          # Routing
└── app.ts                 # Componente root
```
