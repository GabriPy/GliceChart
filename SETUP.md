# 🚀 Setup

## Prerequisiti

- Docker 23+ e Docker Compose
- MySQL 8 esterno al container
- Node 20 (solo per sviluppo locale)
- Cloudflare Tunnel (per accesso remoto)

---

## 1 · Configura `.env`

```bash
cp .env.example .env
```

Modifica `.env`:

| Variabile | Descrizione |
|---|---|
| `DB_HOST` | Host MySQL (es. `127.0.0.1` o `host.docker.internal`) |
| `DB_NAME` | Nome database |
| `DB_USER` / `DB_PASSWORD` | Credenziali MySQL |
| `DB_PORT` | Porta MySQL (default `3306`) |
| `FRONTEND_PORT` | Porta host per frontend (default `8080`) |
| `PUBLIC_API_URL` | URL pubblico dell'app (es. `https://glicemia.tuodominio.it`) |
| `GLUROO_BASE_URL` | Endpoint Gluroo/Nightscout |
| `GLUROO_API_SECRET_TOKEN` | Token segreto API |
| `GLUROO_API_SECRET_HEADER` | Header segreto API |
| `POLL_INTERVAL_MINUTES` | Intervallo sync dati (default `5`) |

---

## 2 · Crea il database MySQL

```sql
CREATE DATABASE IF NOT EXISTS glicechart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'glicechart'@'%' IDENTIFIED BY 'password_forte_2026';
GRANT ALL PRIVILEGES ON glicechart.* TO 'glicechart'@'%';
FLUSH PRIVILEGES;
```

> **Nota**: su Windows/Mac usa `host.docker.internal`. Su Linux verifica che MySQL bindi su `0.0.0.0`.

---

## 3 · Avvia lo stack

```bash
docker compose up -d --build
```

Attendi ~30s, poi apri **http://localhost:8080**.

---

## 4 · Verifica

```bash
docker compose logs -f frontend    # log nginx
docker compose logs -f backend     # log Express
```

---

## 🌐 Accesso remoto (Cloudflare Tunnel)

Punta il tunnel al frontend:

```
service: http://localhost:8080
```

Non puntare al backend: le API sono raggiungibili solo tramite proxy nginx.

---

## 🧪 Sviluppo locale (hot reload)

```bash
# Terminal 1: backend
cd backend
npm install
npm run dev        # → http://localhost:3001

# Terminal 2: frontend
cd frontend
npm install
npm run dev        # → http://localhost:5173 (proxy /api → :3001)
```

---

## 🗄 Migrations

Lo schema DB è gestito da file SQL numerati in `backend/migrations/`. Uno script Node applica solo le migration mancanti, in ordine, registrando ogni esecuzione nella tabella `schema_migrations`.

### Comandi

```bash
# Applica tutte le migration mancanti
cd backend && npm run migrate

# In produzione: le migration girano automaticamente all'avvio del container
```

### Come creare una nuova migration

1. Crea un file in `backend/migrations/` con nome progressivo, es. `012_add_column_foo.sql`
2. Scrivi SQL puro: `CREATE TABLE`, `ALTER TABLE`, `INSERT`, etc.
3. Lancia `npm run migrate` o riavvia il container

### Regole

- **Niente logica applicativa nelle migration**: solo schema e seed.
- **Idempotenti**: usa `IF NOT EXISTS`, `INSERT IGNORE`, `ON DUPLICATE KEY UPDATE`.
- **Ordine**: il numero progressivo garantisce l'ordine di esecuzione.
- **Errore**: se una migration fallisce, lo script si ferma e segnala l'errore. Fixa il file e rilancia.

---

## ❓ Troubleshooting

| ❌ | ✅ |
|---|---|
| `ETIMEDOUT` su DB | Verifica `DB_HOST`, utente MySQL `@'%'`, firewall |
| Dashboard vuota | Credenziali Gluroo mancanti o token scaduto |
| Container non parte | `docker compose logs backend` per dettagli |
| `host.docker.internal` non risolve | Usa l'IP della macchina host invece di `host.docker.internal` |

---

## 🔒 PIN Lock

GliceChart supporta un PIN numerico per proteggere l'accesso alla dashboard.

### Configurazione

1. Accedi a **Impostazioni**
2. Nella sezione **PIN Blocco App** imposta un PIN di almeno 4 cifre
3. Il PIN viene salvato come hash SHA-256 nel database (mai in chiaro)

### Comportamento

- All'avvio, se il PIN è attivo, viene mostrata una schermata di sblocco
- Il PIN viene richiesto una sola volta per sessione browser (`sessionStorage`)
- Per bloccare manualmente: chiudi e riapri il browser

### API

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/auth/status` | Verifica se PIN è attivo |
| `POST` | `/api/auth/verify` | Verifica PIN inserito |
| `POST` | `/api/auth/set-pin` | Imposta/aggiorna PIN |
| `POST` | `/api/auth/remove-pin` | Rimuove PIN |

---

## 🧹 Disinstallazione

```bash
docker compose down -v
docker rmi glicechart-frontend:latest glicechart-backend:latest
mysql -e "DROP DATABASE glicechart; DROP USER 'glicechart'@'%';"
```
