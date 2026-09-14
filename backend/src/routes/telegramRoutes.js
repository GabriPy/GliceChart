// src/routes/telegramRoutes.js
const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/telegramController');

router.post('/telegram/webhook', handleWebhook);

module.exports = router;
