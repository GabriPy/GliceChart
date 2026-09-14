// src/routes/readingsRoutes.js
const express = require('express');
const router = express.Router();
const { getCurrent, getReadings, sync } = require('../controllers/readingsController');

router.get('/current', getCurrent);
router.get('/readings', getReadings);
router.post('/sync', sync);

module.exports = router;
