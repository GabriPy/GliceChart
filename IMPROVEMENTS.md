# Miglioramenti Proposti per GliceChart

Questo documento elenca le potenziali evoluzioni del progetto per migliorare la resilienza, l'esperienza utente e le funzionalità analitiche.

## 1. Backend (Resilienza e Sicurezza)
- [ ] **Logging strutturato**: Sostituire `console.log` con una libreria come `winston` o `pino` per log strutturati e rotazione automatica.
- [ ] **Validazione Input**: Implementare `zod` o `joi` per validare i payload delle API (es. impedire valori negativi per insulina o carboidrati).
- [ ] **Middleware Errori**: Creare un gestore centralizzato per gli errori Express per risposte JSON consistenti.
- [ ] **Rate Limiting**: Aggiungere `express-rate-limit` per proteggere le API da loop accidentali o abusi.

## 2. Frontend (UX e Visualizzazione)
- [ ] **Notifiche Browser**: Integrare le Web Notifications API per avvisi in tempo reale su soglie critiche (ipo/iper).
- [ ] **Supporto PWA**: Rendere l'app una Progressive Web App per l'installazione su mobile e l'accesso offline parziale.
- [ ] **Miglioramento Grafici**:
    *   Sfondo colorato dinamico per le zone di target (TIR).
    *   Indicatori grafici (icone) per pasti e correzioni direttamente sulla linea del tempo.
- [ ] **Esportazione Avanzata**: Ottimizzare la generazione di report PDF per il personale medico utilizzando i dati storici.

## 3. Funzionalità Analitiche (Smart)
- [ ] **Calcolatore Bolo**: Strumento interattivo che suggerisce l'insulina necessaria basandosi su Glicemia attuale, Trend, Carboidrati, ISF e Carb Ratio.
- [ ] **IOB & COB (Active Insulin/Carbs)**: Calcolo e visualizzazione dell'insulina e dei carboidrati ancora attivi nel corpo per evitare sovrapposizioni (bolus stacking).
- [ ] **Analisi Trend**: Notifiche predittive se il trend indica una possibile ipoglicemia entro i prossimi 20-30 minuti.

## 4. DevOps e Manutenzione
- [ ] **Docker Healthcheck**: Aggiungere il monitoraggio dello stato nel `docker-compose.yml`.
- [ ] **Testing**: Introdurre unit test per la logica dello store Pinia (Vitest) e integration test per le API (Supertest).
- [ ] **CI/CD**: Configurare una GitHub Action per il linting automatico e la verifica della build ad ogni push.

---
*Documento generato per guidare lo sviluppo futuro di GliceChart.*
