# GliceChart

GliceChart è una dashboard personale open‑source per il monitoraggio glicemico, con integrazione Gluroo/Nightscout, tracking insulina, carboidrati, note ed eventi.  
Progetto monolitico: il backend Node.js serve direttamente il frontend buildato.

## ✨ Funzionalità principali
- Sincronizzazione automatica letture glicemiche da Gluroo (cron ogni 5 minuti)
- Grafico andamento glicemico con range personalizzabile
- Time in Range (TIR) configurabile
- Tracking insulina rapida/lenta e carboidrati
- Note ed eventi giornalieri
- Dietometro con database alimenti
- Calendario storico
- Statistiche periodiche
- Predizioni e pattern
- Impostazioni personali (sensibilità insulinica, rapporto CHO, target, ecc.)

## 🧱 Stack Tecnologico
### Frontend
- Vue 3
- Vite
- Tailwind CSS
- DaisyUI
- Chart.js
- Pinia

### Backend
- Node.js
- Express
- MySQL
- node-cron

## 🏗 Architettura
Monolite:
- /backend → API + cron + integrazioni
- /frontend → dashboard Vue
- Il backend serve la build del frontend

## 🚀 Deploy con Docker
1. Copia il file di esempio: `cp .env.example .env`

2. Inserisci nel `.env`:
- Credenziali Gluroo/Nightscout
- Configurazione MySQL (utente, password, nome DB)

3. Avvia tutto: `docker compose up -d`

Dashboard:
http://localhost:3001

## 🔌 Porte
| Servizio | Porta |
|---------|-------|
| App (frontend + API) | 3001 |
| MySQL | 3306 |

## 📄 Licenza
MIT
