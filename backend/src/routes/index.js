// src/routes/index.js
const express = require('express');
const router = express.Router();

const readingsRoutes = require('./readingsRoutes');
const entriesRoutes = require('./entriesRoutes');
const dietRoutes = require('./dietRoutes');
const sensorsRoutes = require('./sensorsRoutes');
const settingsRoutes = require('./settingsRoutes');
const authRoutes = require('./authRoutes');
const historyRoutes = require('./historyRoutes');
const telegramRoutes = require('./telegramRoutes');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use(readingsRoutes);
router.use(entriesRoutes);
router.use(dietRoutes);
router.use(sensorsRoutes);
router.use(settingsRoutes);
router.use(authRoutes);
router.use(historyRoutes);
router.use(telegramRoutes);

module.exports = router;
