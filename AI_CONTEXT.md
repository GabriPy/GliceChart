# AI CONTEXT — GliceChart

> File di contesto per agenti AI che lavorano su questo progetto.
> Leggere attentamente PRIMA di apportare modifiche.

---

## 1. Panoramica Progetto

**GliceChart** è una dashboard personale open-source per il monitoraggio del diabete:
- Sincronizza letture glicemiche in tempo reale da **Gluroo/Nightscout**
- Tracking di insulina (rapida/lenta), carboidrati e note
- Grafici interattivi, statistiche, TIR (Time in Range)
- Dietometro con database alimenti
- Predizioni e analisi pattern
- Interfaccia moderna, mobile-first

L'app è un **monolite Node.js**: il backend Express serve sia le API che i file statici del frontend Vue buildato. Nessun Nginx necessario in produzione.

---

## 2. Stack Tecnologico

### Frontend
```
Vue 3 (Composition API)
├─ Vite 5            (build tool + dev server)
├─ Pinia             (state management — singolo store: glucose.js)
├─ Vue Router 4      (routing SPA)
├─ Tailwind CSS 3    (stili utility-first)
├─ DaisyUI 4         (componenti basati su Tailwind, supporto temi)
├─ theme-change      (cambio tema runtime)
├─ Chart.js 4        (grafici glicemia, statistiche)
│  ├─ vue-chartjs    (wrapper Vue)
│  ├─ chartjs-plugin-annotation
│  └─ chartjs-plugin-zoom
└─ lucide-vue-next   (icone — NON usare altri set)
```

### Backend
```
Node.js 20 (ECMAScript Modules per frontend, CommonJS per backend)
├─ Express 4         (server HTTP + API REST)
├─ mysql2/promise    (driver MySQL con pool connessioni)
├─ node-cron         (sync periodica Gluroo — default ogni 5 min)
├─ dotenv            (variabili d'ambiente da backend/.env)
├─ cors              (CORS abilitato globalmente)
└─ axios             (chiamate API a Gluroo)
```

### DevOps
- **Dockerfile** multi-stage (frontend-build → production)
- **docker-compose.yml**: SOLO servizio `app` (nessun container MySQL)
  - Si connette al MySQL **esterno già esistente** sulla macchina host
  - `extra_hosts: "host.docker.internal:host-gateway"` permette a `host.docker.internal` di funzionare ANCHE su Linux/Docker Engine (non solo Docker Desktop Win/Mac)
  - `DB_HOST` valide:
    - `host.docker.internal` (consigliata, grazie a extra_hosts)
    - `172.17.0.1` (IP bridge docker0 su Linux)
    - IP pubblico/privato della macchina host
  - Su Linux/Debian: file config MySQL in `/etc/mysql/mysql.conf.d/mysqld.cnf`
  - Utente MySQL deve avere `GRANT ... TO 'user'@'%'` (non solo `@'localhost'`)
  - bind-address MySQL = `0.0.0.0`
  - Se ufw attivo: `ufw allow from 172.17.0.0/16 to any port 3306`
- **.env.example** nella root (per Docker)
- **backend/.env** per sviluppo locale (NON committato)

---

## 3. Struttura Directory

```
glicechart/
├─ backend/
│  ├─ server.js         # Entry point: Express, rotte API, cron, serve frontend
│  ├─ db.js             # Pool MySQL + tutte le query SQL + init tabelle
│  ├─ gluroo.js         # Integrazione API Gluroo/Nightscout
│  ├─ package.json
│  └─ .env              # (locale, NON committato)
│
├─ frontend/
│  ├─ src/
│  │  ├─ main.js        # Entry Vue
│  │  ├─ App.vue        # Root component (layout con sidebar)
│  │  ├─ appVersion.js  # Versione app
│  │  ├─ assets/main.css  # Tailwind directives + stili globali
│  │  ├─ router/index.js  # Rotte (views)
│  │  ├─ stores/glucose.js # Store Pinia unico: stato globale + fetch API
│  │  ├─ components/    # Componenti Vue riutilizzabili
│  │  │  ├─ Sidebar.vue
│  │  │  ├─ CurrentGlucose.vue
│  │  │  ├─ GlucoseChart.vue
│  │  │  ├─ StatsChart.vue
│  │  │  ├─ DailyStats.vue
│  │  │  ├─ CarbInput.vue / CarbHistory.vue
│  │  │  ├─ InsulinInput.vue / InsulinHistory.vue
│  │  │  ├─ NoteInput.vue
│  │  │  └─ TrendArrow.vue
│  │  └─ views/         # Pagine complete
│  │     ├─ HomeView.vue         # Dashboard principale
│  │     ├─ CalendarView.vue     # Storico per data
│  │     ├─ DietometerView.vue   # Dietometro
│  │     ├─ PatternsView.vue     # Analisi pattern
│  │     ├─ PredictionView.vue   # Predizioni
│  │     ├─ PeriodicSummaryView.vue
│  │     ├─ SettingsView.vue
│  │     └─ AboutView.vue
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ package.json
│
├─ Dockerfile
├─ docker-compose.yml
├─ .dockerignore
├─ .env.example
├─ README.md
├─ SETUP.md
└─ AI_CONTEXT.md        # ← QUESTO FILE
```

---

## 4. Comandi Principali

### Docker
```bash
docker compose up -d --build  # Build + avvia l'app (si connette al tuo MySQL esterno)
docker compose down           # Ferma tutto
docker compose logs -f app    # Log app in tempo reale
docker compose build --no-cache  # Rebuild immagine da zero
```

### Sviluppo Locale
```bash
# Terminale 1 — Backend
cd backend
npm install
npm run dev          # nodemon server.js (auto-reload)

# Terminale 2 — Frontend (dev server con proxy API)
cd frontend
npm install
npm run dev          # Vite su http://localhost:5173 (proxy /api → :3001)

# Build produzione frontend
cd frontend
npm run build        # Output in frontend/dist/ (servito dal backend)
```

---

## 5. Architettura e Flusso Dati

```
┌─────────────────────────────────────────────────────┐
│                 Node.js (server.js)                  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Express API │  │  node-cron   │  │  Static   │ │
│  │  /api/*      │  │  sync Gluroo │  │  frontend │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
└─────────┼─────────────────┼────────────────┼───────┘
          │                 │                │
          ▼                 ▼                │
     ┌─────────┐      ┌─────────┐           │
     │  MySQL  │◄─────┤ Gluroo  │           │
     │ (tabelle)      │  API    │           │
     └─────────┘      └─────────┘           │
                                             │
                                     Browser Client
                                     (Vue 3 SPA)
```

**Convenzione API**:
- Tutte le rotte iniziano con `/api/`
- Le rotte non `/api/*` vengono servite come file statici o `index.html` (SPA routing)
- I timestamp sono SEMPRE in formato ISO 8601 stringhe (`new Date().toISOString()`) — MAI Date objects
- I response body sono sempre JSON con `{ ... }` per dati o `{ error: 'messaggio' }` per errori
- Status code: 200 (ok), 400 (bad request), 404 (not found), 409 (conflict), 500 (server error)

---

## 6. Endpoint API Principali

Tutte in [server.js](file:///c:/Users/02/Desktop/glicechart/backend/server.js)

### Salute e Sync
| Metodo | Endpoint | Note |
|--------|----------|------|
| GET | `/api/health` | Stato server |
| POST | `/api/sync` | Esegui sync Gluroo manuale |

### Letture Glicemiche
| Metodo | Endpoint | Parametri |
|--------|----------|-----------|
| GET | `/api/current` | Ultima lettura |
| GET | `/api/readings` | `?range=180` (minuti, max 129600 = 90gg) |
| GET | `/api/history/readings` | `?date=YYYY-MM-DD` |

### Insulina
| Metodo | Endpoint | Body |
|--------|----------|------|
| GET | `/api/insulin` | `?range=180` |
| POST | `/api/insulin` | `{ timestamp, type: 'rapid'|'slow', units }` |
| PUT | `/api/insulin/:id` | stesso body |
| DELETE | `/api/insulin/:id` | |
| GET | `/api/history/insulin` | `?date=YYYY-MM-DD` |

### Carboidrati
| Metodo | Endpoint | Body |
|--------|----------|------|
| GET | `/api/carbs` | `?range=180` |
| POST | `/api/carbs` | `{ timestamp, amount }` |
| PUT | `/api/carbs/:id` | stesso body |
| DELETE | `/api/carbs/:id` | |
| GET | `/api/history/carbs` | `?date=YYYY-MM-DD` |

### Note
| Metodo | Endpoint | Body |
|--------|----------|------|
| GET | `/api/notes` | `?range=180` |
| POST | `/api/notes` | `{ timestamp, text }` (text ≤ 200 char) |
| PUT | `/api/notes/:id` | stesso body |
| DELETE | `/api/notes/:id` | |
| GET | `/api/history/notes` | `?date=YYYY-MM-DD` |

### Dietometro
| Metodo | Endpoint | Body |
|--------|----------|------|
| GET | `/api/diet/foods` | Lista tutti gli alimenti |
| POST | `/api/diet/foods` | `{ name, carbs_per_100g, category }` |

### Impostazioni
| Metodo | Endpoint | Body |
|--------|----------|------|
| GET | `/api/settings` | Riga singola |
| PUT | `/api/settings` | `{ tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio }` |

---

## 7. Database Schema

Tabelle create/gestite in [db.js](file:///c:/Users/02/Desktop/glicechart/backend/db.js)

### `readings` — Letture Glicemiche
```sql
id         INT PK AUTO
timestamp  DATETIME UNIQUE
glucose    INT          # mg/dL
trend      VARCHAR(20)  # FLAT, RISING, RISING_FAST, RISING_SLOW, FALLING, ...
raw_trend  VARCHAR(50)
created_at DATETIME DEFAULT NOW()
```

### `insulin_records` — Insulina
```sql
id         INT PK AUTO
timestamp  DATETIME INDEX
type       ENUM('rapid','slow')
units      DECIMAL(4,1)
created_at DATETIME
```

### `carb_records` — Carboidrati
```sql
id         INT PK AUTO
timestamp  DATETIME INDEX
amount     INT          # grammi
created_at DATETIME
```

### `notes` — Note
```sql
id         INT PK AUTO
timestamp  DATETIME INDEX
text       VARCHAR(200)
created_at DATETIME
```

### `diet_foods` — Database Alimenti
```sql
id             INT PK AUTO
name           VARCHAR(100) UNIQUE
carbs_per_100g INT
category       ENUM('primo','secondo','contorno','frutta') DEFAULT 'contorno'
created_at     DATETIME
```

### `settings` — Impostazioni (1 sola riga, id=1)
```sql
id                    INT PK DEFAULT 1 (CHECK id=1)
tir_min               INT DEFAULT 70      # TIR minimo
tir_max               INT DEFAULT 180     # TIR massimo
red_under             INT DEFAULT 55      # Soglia ipoglicemia severa
red_over              INT DEFAULT 250     # Soglia iperglicemia severa
rapid_duration        INT DEFAULT 3       # Durata insulina rapida (h)
slow_duration         INT DEFAULT 24      # Durata insulina lenta (h)
carb_duration         INT DEFAULT 4       # Durata effetto carboidrati (h)
insulin_sensitivity   INT DEFAULT 60      # 1 unità abbassa di N mg/dL
carb_ratio            INT DEFAULT 15      # 1 unità copre N grammi CHO
```

**Importante**: Il db.js contiene anche **migrazioni incremental** in blocchi try/catch per aggiungere colonne su DB esistenti. Quando aggiungi campi a settings o diet_foods, SEGUI LO STESSO PATTERN.

---

## 8. Variabili d'Ambiente

### Per Docker / Root `.env`
Riferimento in `.env.example` e `docker-compose.yml`:
```
DB_HOST                  # host.docker.internal (Win/Mac) o IP host
DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
APP_PORT
POLL_INTERVAL_MINUTES
PUBLIC_API_URL
GLUROO_BASE_URL
GLUROO_API_SECRET_TOKEN   # Obbligatoria
GLUROO_API_SECRET_HEADER  # Obbligatoria
```

### Per Sviluppo Locale `backend/.env`
Stesse variabili + `DB_HOST`, `PORT`.

Il backend **non** usa env vars dal frontend. In dev il Vite proxy inoltra `/api/*` a `localhost:3001`.

---

## 9. Preferenze Utente (IMPORTANTE per UI/UX)

Queste vanno rispettate SEMPRE quando modifichi l'interfaccia:

- **Stile**: Moderno, **mobile-first**, "premium"
  - Angoli arrotondati, glassmorphism, ombre soft
  - **Tema scuro** con accenti vibranti (stile Spotify: `#121212`, `#1DB954`)
  - DaisyUI temi integrati
- **Icone**: **Solo `lucide-vue-next`** — NON importare set diversi
- **UX**:
  - Prediligi **Modal e bottom sheets** invece di navigazioni/pagine
  - Animazioni smooth, transizioni fluide
  - Gradienti dinamici
- **Visualizzazione Dati**:
  - Semplicità e minimalismo
  - Grafici Chart.js puliti
  - Tooltip essenziali (non troppe info)
- **Approccio**: Modifica file esistenti > ricreare da zero. Preferisci miglioramenti estetici/funzionali immediati a refactoring complessi.

---

## 10. Pattern di Codice

### Store Pinia (unico store)
- File: [frontend/src/stores/glucose.js](file:///c:/Users/02/Desktop/glicechart/frontend/src/stores/glucose.js)
- TUTTI i fetch API passano da qui
- Stati centralizzati: letture, insulina, carboidrati, note, settings, foods
- Metodi `fetchAll()`, `addInsulin()`, `deleteCarb()`, ecc.

### Componenti Vue
- Composition API + `<script setup>`
- Props typed con `defineProps()`
- Emits typed con `defineEmits()`
- Usa `<script setup>` con auto-import per store e router (se presenti)

### Query DB (backend/db.js)
- SEMPRE usare **Prepared Statements** (`conn.execute(?, [params])`) — MAI string interpolation
- Pool singleton tramite `getPool()` (async lazy-init)
- Tutte le query ritornano Promise, gestite con try/catch nel server

### Integrazione Gluroo (backend/gluroo.js)
- Endpoint: `GET {GLUROO_BASE_URL}/api/v1/entries/sgv.json?count=288`
- Headers: `api-secret` + `Authorization: Bearer {token}`
- Trend normalizzato da numero/stringa a enum `FLAT/RISING/RISING_FAST/RISING_SLOW/FALLING/FALLING_FAST/FALLING_SLOW`

---

## 11. Regole e Convenzioni

1. **NON committare file `.env` o contenenti password/token**
2. **Versioni**: Frontend e backend hanno lo stesso version number (package.json) — aggiorna `appVersion.js` anche
3. **Docker**: Il Dockerfile copia `frontend/dist/` in `../frontend/dist` rispetto a backend — il percorso relativo in server.js funziona
4. **Vite Proxy**: In sviluppo, il frontend su :5173 usa proxy per `/api → localhost:3001`. In produzione, API e frontend sono sullo stesso dominio/porta.
5. **Gestione Date**: Usa SEMPRE ISO strings (`toISOString()`) tra backend e frontend. Converti in `Date` solo lato frontend per visualizzazione.
6. **Sicurezza**: CORS è aperto globalmente (intenzionale per Cloudflare Tunnel / deploy pubblici). Non aggiungere autenticazione senza richiesta esplicita.
7. **Database**: Non rinominare o cancellare tabelle/colonne esistenti — aggiungi solo colonne NUOVE con la pattern di migrazione try/catch in `initDB()`.

---

## 12. Troubleshooting Rapido

| Problema | Causa probabile |
|----------|-----------------|
| Backend non parte | `.env` mancante o credenziali MySQL errate |
| Nessuna lettura in dashboard | Credenziali Gluroo mancanti o token scaduto |
| Frontend chiama API su porta sbagliata | Controlla `vite.config.js` proxy (solo dev) |
| Docker app non connette a MySQL locale | 1) Verifica `DB_HOST=host.docker.internal`; 2) Assicurati che MySQL sia in ascolto su `0.0.0.0` (non solo `127.0.0.1`); 3) Utente MySQL ha permessi da host `%` |
| Grafici non si aggiornano | Store Pinia non ha chiamato `fetchAll()` o data range non include nuove entries |

---

## 13. File Chiave da Modificare per Attività Comuni

| Cosa vuoi fare | Dove |
|----------------|------|
| Aggiungere una nuova pagina | `frontend/src/views/` + registra in `router/index.js` + aggiungi link a `Sidebar.vue` |
| Aggiungere un campo a Settings | `settings` tabella in `db.js` (migration + INSERT IGNORE) → `getSettings/updateSettings` → rotta PUT in `server.js` → form in `SettingsView.vue` → store Pinia |
| Nuova tabella DB | `initDB()` in `db.js` + funzioni CRUD + export module.exports + rotte in `server.js` |
| Cambiare colore tema | `tailwind.config.js` (DaisyUI themes) + `theme-change` in App o Settings |
| Modificare velocità sync | `POLL_INTERVAL_MINUTES` in .env (non hardcodare) |
| Aggiungere campo a letture | Tabella `readings` + `insertReading` + `fetchLatestReadings` in gluroo.js + store Pinia + visualizzazione in un componente |

---

*Fine contesto. In bocca al lupo.*
