// src/routes/entriesRoutes.js
const express = require('express');
const router = express.Router();
const {
  getInsulin,
  postInsulin,
  putInsulin,
  deleteInsulinEntry,
  getCarbs,
  postCarb,
  putCarb,
  deleteCarbEntry,
  getNotes,
  postNote,
  putNote,
  deleteNoteEntry
} = require('../controllers/entriesController');

// Insulina
router.get('/insulin', getInsulin);
router.post('/insulin', postInsulin);
router.put('/insulin/:id', putInsulin);
router.delete('/insulin/:id', deleteInsulinEntry);

// Carboidrati
router.get('/carbs', getCarbs);
router.post('/carbs', postCarb);
router.put('/carbs/:id', putCarb);
router.delete('/carbs/:id', deleteCarbEntry);

// Note
router.get('/notes', getNotes);
router.post('/notes', postNote);
router.put('/notes/:id', putNote);
router.delete('/notes/:id', deleteNoteEntry);

module.exports = router;
