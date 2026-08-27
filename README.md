<div align="center">

[![GliceChart](https://img.shields.io/badge/GliceChart-1.1.0-%235865F2?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgM2gxOHYxOEgzeiIvPjxwYXRoIGQ9Ik0zIDloMTgiLz48cGF0aCBkPSJNOSAzdjE4Ii8+PC9zdmc+)](https://github.com/)
[![Vue](https://img.shields.io/badge/Vue-3.3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-20-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-00758F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

<div align="center">

# 📈 GliceChart

### *La dashboard open-source per il monitoraggio intelligente del diabete*

**Glicemia in tempo reale · Time in Range · Insulina & Carboidrati · Pattern predittivi · Telegram Alerts**

> Un monolite Node.js + Vue 3 elegante, performante e auto-ospitabile.
> Zero dipendenze cloud: i tuoi dati rimangono **solo nel tuo MySQL**.

</div>

---

## ⚡ Quick Start (3 comandi)

```bash
# 1. Copia le variabili d'ambiente
cp .env.example .env

# 2. Modifica .env — inserisci credenziali MySQL e Gluroo
$EDITOR .env

# 3. Avvia tutto
docker compose up -d --build
```

✅ **Fatto.** Apri [http://localhost:3001](http://localhost:3001)

Per setup locale avanzato, troubleshooting MySQL Docker, permessi utente → [SETUP.md](./SETUP.md)

---

## ✨ Funzionalità

<div align="center">

| Funzionalità | Descrizione |
|---|---|
| 🩸 **Live Glucose** | Ultima lettura + freccia trend + soglie colori personalizzabili |
| 📊 **Time in Range** | TIR, TAR, TBR con distribuzione oraria + statistiche 7/14/30/90 giorni |
| 💉 **Insulina** | Quick entry rapida/lenta, storico, validazione step 0.5 U |
| 🍞 **Carboidrati** | Tracking, Dietometro con DB alimenti e porzioni peso |
| 📅 **Calendario** | Storico giornaliero completo: letture, boli, CHO, note |
| 🧠 **Pattern Smart** | Analisi comportamento: risalite/ribassi ricorrenti + effetto note |
| 🔮 **Predizione** | Stima 60min tramite ROC + IOB + COB + fattori di sensibilità |
| 🔔 **Telegram** | Alert ipo/iper, conferme boli, riepilogo giornaliero personalizzabile |
| 📤 **Export** | Report completo, CSV, PDF clinico — per il tuo endocrinologo |
| 🌍 **i18n** | Italiano / Inglese, auto-detect browser, persistence localStorage |
| 🎨 **Theming** | +32 temi DaisyUI integrati, switch istantaneo, dark-mode nativo |

</div>

---

## 🏗 Architettura

GliceChart è un **monolite bimodulo deployabile in singolo container**:

```
                    ┌───────────────────────────────────┐
                    │       Single Docker Container       │
                    │                                     │
  Browser (SPA) ───▶│  Express 4                         │
  :3001             │  ├─ /api/*    ────▶ REST API       │
                    │  ├─ /*        ────▶ Vue statico    │
                    │  └─ node-cron ────▶ sync Gluroo    │
                    │           │                         │
                    │           ▼                         │
                    │       mysql2/promise ──────────────┼──▶ MySQL ESTERNO
                    └───────────────────────────────────┘        (host / rete)
```

### Perché un monolite?

- **Zero reverse-proxy** (niente Nginx, niente CORS cross-domain)
- **Build ottimizzata**: frontend compilato e servito direttamente da Express
- **Deploy ovunque**: singolo container, Cloudflare Tunnel, VPN o porta mappata
- **Cold-start**: <1s dopo la build, footprint ~180MB RAM idle

---

## 🧱 Stack Tecnologico

### Frontend (`/frontend`)
```
┌─────────────────────────────────────────────────────┐
│ Vue 3.3 Composition API · <script setup>            │
│  ├─ Vite 5            (HMR sub-100ms, ESM build)    │
│  ├─ Pinia 2           (state single-store pattern)  │
│  ├─ Vue Router 4      (Lazy-load code-split routes) │
│  ├─ Vue I18n 9        (IT / EN · formats datetime)  │
│  ├─ Tailwind 3        (utility-first + JIT)         │
│  ├─ DaisyUI 4         (32 temi · componenti)        │
│  ├─ theme-change      (tema runtime persistente)    │
│  ├─ Chart.js 4        (glicemia · TIR · barre)      │
│  │   └─ plugins: zoom / annotation                  │
│  ├─ jsPDF + AutoTable (report PDF clinico)          │
│  ├─ PapaParse         (CSV export)                  │
│  └─ Lucide Vue        (icone set coerente)          │
└─────────────────────────────────────────────────────┘
```

### Backend (`/backend`)
```
┌─────────────────────────────────────────────────────┐
│ Node.js 20 Alpine · CommonJS                        │
│  ├─ Express 4         (API + static host + cron)    │
│  ├─ mysql2/promise    (pool connessioni, PS)        │
│  ├─ node-cron         (polling Gluroo default 5min) │
│  ├─ dotenv            (backend/.env isolato)        │
│  ├─ cors              (*, necessario per tunnel)    │
│  └─ axios             (HTTP client Gluroo/Telegram) │
└─────────────────────────────────────────────────────┘
```

### DevOps
| Tool | Uso |
|---|---|
| **Dockerfile** multi-stage | stage 1 = build Vue, stage 2 = Node production (~280MB) |
| **docker-compose.yml** | Servizio singolo, `host.docker.internal` cross-platform |
| **BuildKit cache mounts** | Dipendenze npm cachate tra build — -60% tempo rebuild |

---

## 📁 Struttura del Progetto

```
GliceChart/
├── backend/
│   ├── server.js          ⚙️  Entry Express + rotte API + cron
│   ├── db.js              🗄   Pool MySQL + tutte le query + migrazioni
│   ├── gluroo.js          🔗  Integrazione Nightscout/Gluroo
│   ├── package.json       (backend: v4.5.0-beta)
│   └── .env               (locale, NON commitare)
│
├── frontend/
│   └── src/
│       ├── main.js                🚀  Entry Vue
│       ├── App.vue                🧱  Layout root (sidebar + outlet)
│       ├── appVersion.js          🏷   Versione allineata package.json
│       ├── i18n/                  🌍  IT / EN
│       ├── router/index.js        🛣   8 routes code-split
│       ├── stores/glucose.js      🍍  Single Pinia store
│       ├── components/            🧩  12 componenti riusabili
│       ├── views/                 📄  Pagine complete
│       ├── utils/exportService.js 📤  Export CSV + PDF
│       └── assets/main.css        🎨  Tailwind directives + globals
│
├── Dockerfile              🐳  Multi-stage Alpine
├── docker-compose.yml      🧩  Single-service + env-var defaults
├── .env.example            📋  Template 1:1 con compose
├── README.md               ← TU QUI
├── SETUP.md                🔧  Guida setup approfondita
└── AI_CONTEXT.md           🤖  Contesto tecnico per AI agents
```

---

## 🔌 Porte & Rete

| Servizio | Porta | Descrizione |
|---|---|---|
| **Dashboard + API** | `3001/tcp` | App completa, frontend + `/api/*` |
| **MySQL** | `3306/tcp` | Esterno al container — sulla tua macchina |

> 💡 **Suggerimento Cloudflare Tunnel**: mappa `3001` → `https://tuodominio.it` per accesso remoto sicuro, **senza port-forwarding**.

---

## 🚀 Roadmap

- [ ] Supporto Nightscout API self-hosted oltre a Gluroo
- [ ] Tema "clinico" con contrasto WCAG AAA
- [ ] Share-link lettura-only per i caregiver
- [ ] Annotazioni eventi (sport, malattia, ciclo)
- [ ] Export report A1C al medico via email/Telegram

---

## 🛡 Disclaimer Medico

> ⚠️ **GliceChart è uno strumento di supporto personale basato su algoritmi matematici standard.**
> Non sostituisce in alcun modo il parere di un medico specialista.
> Consulta SEMPRE il tuo diabetologo / endocrinologo prima di modifiche terapeutiche,
> aggiustamenti di dosi insuliniche o regimi alimentari.

---

## 📄 Licenza

[MIT](https://opensource.org/licenses/MIT) © Made with ❤️ from the community

---

<div align="center">

*Se ti aiuta a gestire meglio la giornata, una ⭐ al progetto è sempre benvenuta.*

</div>
