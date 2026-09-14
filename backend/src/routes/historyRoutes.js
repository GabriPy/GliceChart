// src/routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const {
  getHistoryReadings,
  getHistoryInsulin,
  getHistoryInsulinOverlap,
  getHistoryCarbs,
  getHistoryNotes
} = require('../controllers/historyController');

router.get('/history/readings', getHistoryReadings);
router.get('/history/insulin', getHistoryInsulin);
router.get('/history/insulin-overlap', getHistoryInsulinOverlap);
router.get('/history/carbs', getHistoryCarbs);
router.get('/history/notes', getHistoryNotes);

module.exports = router;
