# Setup – Ambiente Docker

GliceChart è progettato per essere eseguito interamente tramite Docker.  
Non è richiesto alcun setup locale di Node.js, MySQL o dipendenze: tutto viene gestito dai container.

## 📦 Requisiti
- Docker
- Docker Compose
- File .env configurato

## ⚙️ Configurazione .env
Prima di avviare l’applicazione, copia il file di esempio:

cp .env.example .env

All’interno del file .env inserisci:
- Credenziali Gluroo/Nightscout
- Configurazione MySQL (utente, password, nome DB)

Il database MySQL viene creato automaticamente dal container.

## 🚀 Avvio dell’applicazione
Per avviare l’intero stack:

docker compose up -d

Questo comando crea e avvia:
- Container backend (Node.js + API + cron)
- Container MySQL
- Build frontend servita dal backend

## 🌐 Accesso alla dashboard
Una volta avviato tutto, la dashboard è disponibile su:

http://localhost:3001

## 🔄 Cron
Il backend esegue automaticamente:
- Sincronizzazione glicemie ogni 5 minuti
- Eventuali job futuri definiti nella cartella /backend/cron

## 🔌 Porte utilizzate
| Servizio | Porta |
|---------|-------|
| App (frontend + API) | 3001 |
| MySQL | 3306 |

## 🧱 Architettura Docker
Lo stack è composto da:
- backend: container Node.js che serve la build del frontend
- db: container MySQL con volume persistente
- frontend: build statica generata automaticamente e servita dal backend

## 🛠 Sviluppo (opzionale)
Se vuoi sviluppare senza Docker:
- frontend: pnpm dev
- backend: pnpm dev

Ma non è necessario per l’utilizzo normale del progetto.

## 📄 Note
- Tutti gli aggiornamenti del codice richiedono un rebuild del container backend.
- Il database è persistente tramite volume Docker.
