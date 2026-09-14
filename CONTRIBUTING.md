# Guida al Contributo in GliceChart

Grazie per il tuo interesse a contribuire a **GliceChart**! Questa guida spiega come configurare l'ambiente di sviluppo locale, eseguire i test ed inviare pull request conformi agli standard del progetto.

---

## 🛠 Setup Sviluppo Locale

### Prerequisiti
- Node.js 20+
- MySQL 8+
- Git

### Installazione Dipendenze
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in un altro terminale)
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing Obbligatorio

Prima di aprire una Pull Request, assicurati che tutti i test passino localmente:

```bash
# Esegui i test unitari del backend
cd backend
npm test

# Esegui i test unitari del frontend (Vitest)
cd frontend
npm run test

# Verifica che la build del frontend compili senza errori
npm run build
```

---

## 📐 Linee Guida per il Codice

1. **Rigore Clinico**: Qualsiasi modifica agli algoritmi di calcolo glicemico, IOB, COB o statistiche AGP deve essere supportata da test unitari dedicati in `frontend/src/stores/__tests__/stats.test.js`.
2. **Architettura Modulare**:
   - Backend: mantieni i controller snelli, isola le query in `backend/src/db/queries/` e la logica in `backend/src/services/`.
   - Frontend: componi le viste utilizzando componenti riutilizzabili (`PageHeader.vue`, DaisyUI / Tailwind tokens standard).
3. **Commit Messages**: Usa convenzioni SemVer / Conventional Commits (`feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `docs: ...`).

---

## 🔀 Workflow Pull Request

1. Fai il fork del repository e crea un branch descrittivo (`feature/nuovo-sensore` o `fix/calcolo-iob`).
2. Implementa le modifiche e aggiungi test pertinenti.
3. Verifica che la CI di GitHub Actions sia verde.
4. Apri la Pull Request descrivendo chiaramente problema, soluzione e prove di test.
