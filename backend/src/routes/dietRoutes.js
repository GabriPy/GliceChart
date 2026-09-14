// src/routes/dietRoutes.js
const express = require('express');
const router = express.Router();
const { getFoods, postFood } = require('../controllers/dietController');

router.get('/diet/foods', getFoods);
router.post('/diet/foods', postFood);

module.exports = router;
