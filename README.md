<div align="center">

[![GliceChart](https://img.shields.io/badge/GliceChart-%235865F2?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgM2gxOHYxOEgzeiIvPjxwYXRoIGQ9Ik0zIDloMTgiLz48cGF0aCBkPSJNOSAzdjE4Ii8+PC9zdmc+)](https://github.com/)

</div>

---

# 📈 GliceChart

### *La dashboard open-source per il monitoraggio intelligente del diabete*

**Glicemia in tempo reale · Time in Range · Insulina & Carboidrati · Pattern predittivi · Telegram Alerts**

> Vue 3 + Express + MySQL. Zero dipendenze cloud: i tuoi dati rimangono **solo nel tuo server**.

---

## ⚡ Quick Start

```bash
cp .env.example .env
$EDITOR .env
docker compose up -d --build
```

Apri **http://localhost:8080**

---

## 🏗 Architettura

```
                     ┌───────────────────────────────────┐
                     │       Docker Network (internal)    │
                     │                                     │
   Cloudflare Tunnel │  ┌─────────────┐    ┌─────────────┐│
   ──────────────────▶│  │  Frontend   │    │   Backend   ││
                     │  │  (nginx)    │───▶│   (Express) ││
   Browser (SPA) ───▶│  │  :80        │    │   :3001     ││
                     │  └─────────────┘    └─────────────┘│
                     │       │                     │      │
                     │       ▼                     ▼      │
                     │  Static assets      REST API + cron │
                     └───────────────────────────────────┘
                                        │
                                        ▼
                                   MySQL ESTERNO
```

- **Frontend pubblico**: Cloudflare Tunnel punta a nginx (`:80`).
- **Backend privato**: le API non sono esposte. Tutto il traffico passa per nginx.
- **Proxy**: `/api/*` → `http://backend:3001` (rete Docker interna).

---

## 🧱 Stack

| Layer | Tool |
|---|---|
| **Frontend** | Vue 3, Vite, Pinia, Tailwind 3, DaisyUI, Chart.js, jsPDF |
| **Backend** | Express 4, mysql2, node-cron, axios, cors |
| **Proxy** | nginx Alpine (`/api/` → backend) |
| **Infra** | Docker Compose, Cloudflare Tunnel |
| **DB** | MySQL 8 esterno al container |

---

## 📁 Struttura

```
GliceChart/
├── backend/
│   ├── server.js          Express + API + cron
│   ├── db.js              MySQL pool + queries
│   ├── gluroo.js          Integrazione Gluroo/Nightscout
│   ├── Dockerfile         Node 20 Alpine
│   └── package.json
├── frontend/
│   ├── src/               Vue 3 + Vite + Pinia
│   ├── nginx.conf         Proxy /api/ → backend
│   ├── Dockerfile         nginx Alpine
│   └── package.json
├── docker-compose.yml     Due servizi: frontend + backend
├── .env                   Variabili d'ambiente (NON commitare)
├── .env.example           Template
└── cloudflared.example.yml Template tunnel Cloudflare
```

---

## 🔌 Porte

| Servizio | Porta host | Descrizione |
|---|---|---|
| **Frontend** | `8080/tcp` | SPA Vue + proxy API |
| **Backend** | *non esposta* | Solo rete Docker interna |
| **MySQL** | `3306/tcp` | Esterno alla macchina host |

---

## 🚀 Roadmap

- [ ] Supporto Nightscout self-hosted oltre a Gluroo
- [ ] Tema WCAG AAA
- [ ] Share-link caregiver
- [ ] Annotazioni eventi
- [ ] Export A1C via email/Telegram

---

## 🛡 Disclaimer

> ⚠️ Strumento di supporto personale. Non sostituisce il parere medico specialista.

---

## 📄 Licenza

[MIT](https://opensource.org/licenses/MIT) © Made with ❤️ from the community
