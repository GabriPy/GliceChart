# GliceChart

Dashboard personale per monitoraggio glicemico, con integrazione Gluroo/Nightscout, tracking insulina, carboidrati e note.

## Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS + DaisyUI + Chart.js + Pinia
- **Backend**: Node.js + Express + MySQL + node-cron
- **Architettura**: Monolite - Backend serve il frontend buildato (nessun Nginx necessario)

## Avvio Rapido (Docker)

```bash
cp .docker.env.example .docker.env
# Modifica .docker.env con le credenziali Gluroo e MySQL
docker compose up -d
```

Apri: http://localhost:3001

## Sviluppo Locale

Vedi [SETUP.md](SETUP.md).

## Caratteristiche

- Sincronizzazione automatica letture glicemiche da Gluroo (cron ogni 5 min)
- Grafico andamento glicemico con range personalizzabile
- Time in Range (TIR) personalizzabile
- Tracking insulina rapida/lenta e carboidrati
- Note ed eventi
- Dietometro con database alimenti
- Calendario storico giornaliero
- Statistiche periodiche
- Predizioni e pattern
- Impostazioni personali (sensibilità insulinica, rapporto CHO, ecc.)

## Porte

| Servizio | Porta |
|----------|-------|
| App (frontend + API) | 3001 |
| Frontend dev (Vite) | 5173 |
| MySQL | 3306 |
