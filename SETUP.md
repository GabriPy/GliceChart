# 🔧 Setup & Deployment Guide — GliceChart

> **Guida ufficiale aggiornata 2026.**
> Due percorsi ufficiali: **Docker (consigliato)** o **Sviluppo Locale**.
> MySQL è **sempre esterno** al container.

---

## 📦 Prerequisiti

### Percorso A · Docker (tutto incluso, zero setup locale)

| Software | Versione minima | Verifica |
|---|---|---|
| Docker Engine | 26.0+ | `docker --version` |
| Docker Compose Plugin | v2.20+ | `docker compose version` |

- ✅ **Docker Desktop** (Win/Mac): già contiene Compose e BuildKit
- ✅ **Linux Server**: `apt install docker.io docker-compose-plugin`

---

### Percorso B · Sviluppo Locale (solo se modifichi codice)

| Software | Versione | Verifica |
|---|---|---|
| Node.js | **20.x LTS** | `node -v` |
| npm | ≥ 10 | `npm -v` |
| MySQL | **8.0+** | `mysql -V` |

- Windows: [Node via fnm](https://github.com/Schniz/fnm) + [MySQL da Dev](https://dev.mysql.com/downloads/installer/)
- macOS: `brew install node@20 mysql`
- Debian/Ubuntu: Node via [nodesource](https://github.com/nodesource/distributions)

---

---

## 🚀 Percorso A · Deploy con Docker (0 → dashboard in ~2min)

### Step 1 · Prepara il file `.env`

```bash
cp .env.example .env
```

Apri `.env` con un editor e imposta **almeno** queste 4:

```dotenv
# ── Connessione MySQL (esterno al container) ─────────────────────────
DB_HOST=host.docker.internal   # ✅ Win/Mac/Linux (grazie extra_hosts)
DB_NAME=glicechart
DB_USER=tuo_utente
DB_PASSWORD=la_tua_password
DB_PORT=3306

# ── Integrazione Gluroo ───────────────────────────────────────────────
GLUROO_BASE_URL=https://xxxxxxx.gluroo.com
GLUROO_API_SECRET_TOKEN=2827d0a...
GLUROO_API_SECRET_HEADER=04165...

# ── Opzionali ─────────────────────────────────────────────────────────
PORT=3001
POLL_INTERVAL_MINUTES=5
PUBLIC_API_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

> 🛡 **NOTA SICUREZZA**: `.env` è **ignorato da git** — NON committarlo MAI.

---

### Step 2 · Assicurati che MySQL sia raggiungibile dal container

Il container parla con MySQL sulla **tua macchina host**. Devi avere:

1. **MySQL bind-address = 0.0.0.0** (non solo `127.0.0.1`)

   ```ini
   # /etc/mysql/mysql.conf.d/mysqld.cnf  (Linux Debian/Ubuntu)
   bind-address = 0.0.0.0
   mysqlx-bind-address = 127.0.0.1
   ```

2. **Utente MySQL autorizzato da host diversi** (`%` invece di `localhost`)

   ```sql
   -- MySQL CLI
   CREATE USER IF NOT EXISTS 'glicechart'@'%' IDENTIFIED BY 'password_forte_2026';
   CREATE DATABASE IF NOT EXISTS glicechart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   GRANT ALL PRIVILEGES ON glicechart.* TO 'glicechart'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Firewall consenta la porta 3306 dalla bridge Docker**

   ```bash
   # Linux con ufw
   ufw allow from 172.17.0.0/16 to any port 3306 comment 'GliceChart Docker MySQL'
   ```

> 💡 Alternativa più semplice: se usi Docker Desktop Win/Mac salta tutto questo —
> `host.docker.internal` funziona out-of-the-box e l'utente `'utente'@'%'` basta.

---

### Step 3 · Build + Run

```bash
docker compose up -d --build
```

Cosa succede adesso:
1. 🐳 **Stage 1**: Vite builda il frontend Vue (cache npm con BuildKit)
2. 🐳 **Stage 2**: Immagine Alpine Node 20 + dipendenze di produzione
3. 🔌 Crea il container connettibile a `host.docker.internal`
4. ⏱ Avvia il cron di sync ogni **5 min**
5. 🏗 Crea **automaticamente** tabelle + migrazioni sul DB (se non esistono)

Attendi ~30 secondi, poi apri:

```
http://localhost:3001
```

✅ La prima schermata è la Dashboard. Se hai inserito credenziali Gluroo,
entro 5 minuti arrivano le prime letture.

---

### Step 4 · Comandi di gestione

| Comando | Cosa fa |
|---|---|
| `docker compose up -d --build` | Builda (se serve) + avvia il servizio |
| `docker compose build --no-cache` | Rebuild pulito senza cache layers |
| `docker compose down` | Ferma il servizio (mantiene dati su DB) |
| `docker compose logs -f glicechart` | Log in tempo reale dell'app |
| `docker compose restart glicechart` | Riavvia il container |
| `docker compose exec glicechart node -e "console.log(process.env)"` | Debug env vars |

---

### Step 5 · Pull degli aggiornamenti

```bash
cd GliceChart
git pull
docker compose up -d --build        # ← ricostruisce con il codice nuovo
```

> 🗄 **I dati sono al sicuro**: MySQL è **esterno al container** — rebuildare l'immagine
> non tocca in nessun modo le tabelle. Solo una reinstallazione del DB o un `DROP DATABASE`
> cancellano i dati.

---

---

## 🧪 Percorso B · Sviluppo Locale (hot reload)

### 1 · Clona + installa dipendenze

```bash
cd GliceChart

# Backend
cd backend
npm install

# Frontend (nuovo terminale)
cd ../frontend
npm install
```

### 2 · Crea `backend/.env` per sviluppo locale

```bash
cp backend/.backend.env.example backend/.env
# oppure scrivilo a mano:
```

```dotenv
# backend/.env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=glicechart
DB_USER=root
DB_PASSWORD=root
PORT=3001
POLL_INTERVAL_MINUTES=5
GLUROO_BASE_URL=...
GLUROO_API_SECRET_TOKEN=...
GLUROO_API_SECRET_HEADER=...
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 3 · Avvia MySQL locale (servizio attivo sulla porta 3306)

Crea DB + utente se non esiste, come visto al Percorso A.

### 4 · Avvia backend + frontend in parallelo

```bash
# Terminale 1 — Backend (nodemon → auto-reload su edit)
cd backend
npm run dev
# → in ascolto su :3001

# Terminale 2 — Frontend (Vite + HMR + proxy API)
cd frontend
npm run dev
# → in ascolto su :5173  (tutte le chiamate /api → proxy a localhost:3001)
```

Apri **http://localhost:5173** (non 3001 in sviluppo: così ottieni HMR a caldo).

---

### Workflow quotidiano

| Cosa vuoi fare | Comando / File |
|---|---|
| Modificare UI Vue | Edit in `frontend/src/` — Vite ricarica sub-100ms |
| Modificare API | Edit in `backend/server.js` / `db.js` — nodemon riparte |
| Nuova tabella DB | Aggiungi `CREATE TABLE IF NOT EXISTS` in `backend/db.js` dentro `initDB()` |
| Nuovo campo Settings | Aggiungi colonna in settings + migrazione ALTER TABLE try/catch |
| Build produzione frontend | `cd frontend && npm run build` → cartella `dist/` |
| Test build di produzione | `docker compose up -d --build` |

---

---

## ✅ Checklist Primo Avvio

- [ ] `.env` popolato con DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
- [ ] MySQL attivo e in ascolto su `0.0.0.0:3306`
- [ ] Utente MySQL creato con `@'%'` e grant sul DB giusto
- [ ] (Se Linux) ufw consente 3306 da sottorete Docker `172.17.0.0/16`
- [ ] Credenziali Gluroo inserite (token + header + base-url)
- [ ] `docker compose up -d --build` eseguito senza errori
- [ ] `docker compose logs -f glicechart` NON mostra errori di connessione DB
- [ ] `http://localhost:3001` carica la Dashboard

---

## 🔍 Troubleshooting Rapido

| ❌ Sintomo | ✅ Soluzione più probabile |
|---|---|
| App container non parte, log mostra `ETIMEDOUT` su DB | MySQL non è raggiungibile. Verifica `DB_HOST`, utente `@'%'`, firewall, bind-address. |
| Container si avvia ma dashboard è vuota | Credenziali Gluroo mancanti / token scaduto. Controlla log con `docker compose logs`. |
| Docker Linux non risolve `host.docker.internal` | Il `docker-compose.yml` ha già `extra_hosts:` — ricontrolla che DB bind sia `0.0.0.0`. |
| `npm run dev` frontend non carica l'API | Vite proxy non funziona? Verifica che backend sia UP su `:3001` e `vite.config.js` invariato. |
| Sync ogni 5min non parte | Log grep per `cron` o `Error fetching readings`. Verifica `POLL_INTERVAL_MINUTES`. |
| Temi non si applicano | Pulisci localStorage o forza refresh hard (Ctrl/⌘ + Shift + R). |
| PDF export non viene generato | Controlla che `jsPDF` sia in dipendenze e nessun blocker CSP nel browser. |
| Change lingua rompe i grafici TIR | ✅ Fixato in v1.1 — StatsChart non usa più match su stringa titolo localizzato. |

### Log di debug del backend

```bash
# Ultime 50 righe
docker compose logs --tail=50 glicechart

# In tempo reale, filtra per errori
docker compose logs -f glicechart 2>&1 | grep -iE "error|warn|fail"
```

---

## 📊 Comandi MySQL utili per checkup

```sql
USE glicechart;

-- Ultime 10 letture
SELECT timestamp, glucose, trend FROM readings ORDER BY id DESC LIMIT 10;

-- Totale letture / boli / CHO
SELECT
  (SELECT COUNT(*) FROM readings)       AS letture,
  (SELECT COUNT(*) FROM insulin_records) AS boli_insulina,
  (SELECT COUNT(*) FROM carb_records)    AS registrazioni_cho,
  (SELECT COUNT(*) FROM notes)           AS note;

-- Ultimo sync: orario ultima lettura
SELECT DATE_FORMAT(MAX(timestamp), '%d/%m/%Y %H:%i') AS ultima_lettura FROM readings;
```

---

## 🛠 Configurazioni Avanzate

### 🔔 Telegram

1. Crea un bot con **@BotFather** su Telegram → ottieni `TELEGRAM_BOT_TOKEN`
2. Scrivi un qualsiasi messaggio al tuo bot
3. Apri `https://api.telegram.org/bot<TOKEN>/getUpdates` → copia `chat.id` = `TELEGRAM_CHAT_ID`
4. Inserisci entrambe nel `.env` e riavvia: `docker compose up -d`
5. Vai in Impostazioni → **Telegram Notifications** → attiva gli alert che vuoi
6. ✅ Hai finito.

### 🌐 Accesso remoto con Cloudflare Tunnel

```bash
# 1. Installa cloudflared
# 2. Autentica: cloudflared tunnel login
# 3. Crea tunnel + hostname
cloudflared tunnel create glicechart
cloudflared tunnel route dns glicechart glicemia.tuodominio.it
cloudflared tunnel run --url http://localhost:3001 glicechart
```

Poi imposta `PUBLIC_API_URL=https://glicemia.tuodominio.it` nel `.env`.

### ⚡ Velocizzare la build Docker

- BuildKit è già attivo di default (Docker 23+)
- **Cache mount npm**: già presente in Dockerfile — non serve altro
- Prima build ~2min, build successive con codice invariato ~15s

---

## 🧹 Disinstallazione pulita

```bash
docker compose down -v
docker rmi glicechart-app:latest
# Poi droppa il database MySQL se non serve più:
mysql -e "DROP DATABASE glicechart; DROP USER 'glicechart'@'%';"
```

---

## ❓ Serve aiuto?

Se hai errori strani o vuoi una feature specifica:
1. Controlla questa guida da capo
2. Guarda i log (`docker compose logs`)
3. Ricontrolla `.env` (spazi, password, virgolette)

Buon controllo! 💉🩸📉
