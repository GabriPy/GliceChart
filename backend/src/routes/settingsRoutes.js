// src/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { fetchSettings, modifySettings } = require('../controllers/settingsController');

router.get('/settings', fetchSettings);
router.put('/settings', modifySettings);

module.exports = router;
