# Security & Privacy Policy

## 🛡 Privacy First: Dati Sanitari e Sicurezza

GliceChart è progettato per gestire dati personali sensibili relativi alla salute (monitoraggio continuo del glucosio, dosaggi di insulina, assunzione di carboidrati e registri terapeutici).

### Principi Fondamentali di Progettazione
1. **Self-Hosted & Zero-Cloud di terze parti**: I tuoi dati risiedono **esclusivamente** sul tuo server/computer locale e nel tuo database MySQL. Nessuna telemetria o dato clinico viene inviato a server terzi.
2. **Architettura di rete isolata**: In configurazione Docker, le API backend non sono esposte direttamente a Internet; tutto il traffico passa tramite il reverse proxy nginx interno.
3. **Crittografia e PIN Lock**:
   - Gli hash dei PIN sono calcolati tramite SHA-256 e non vengono mai salvati in chiaro.
   - I token di recupero sessione hanno scadenza temporale (TTL) e rate limiting anti brute-force integrato.

---

## 🔒 Segnalazione Vulnerabilità di Sicurezza (Responsible Disclosure)

Se scopri una vulnerabilità di sicurezza in GliceChart:
- **NON** aprire un'issue pubblica su GitHub.
- Invia una comunicazione dettagliata via email o tramite messaggio privato al maintainer principale: `gabriele.pili@glicechart.local` (o via GitHub Security Advisory privata sul repository).
- Includi i passaggi dettagliati per riprodurre il problema, il vettore d'attacco potenziale e la versione affetta.

Il team si impegna a:
- Rispondere entro 48 ore dalla ricezione della segnalazione.
- Rilasciare una patch correttiva nel minor tempo possibile.
- Riconoscere pubblicamente il contributo del ricercatore di sicurezza nelle release note (se desiderato).
