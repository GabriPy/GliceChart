// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAuthStatus,
  verifyPin,
  setPin,
  removePin,
  lockSession,
  requestRecovery,
  verifyRecovery,
  resetPin
} = require('../controllers/authController');

router.get('/auth/status', getAuthStatus);
router.post('/auth/verify', verifyPin);
router.post('/auth/set-pin', setPin);
router.post('/auth/remove-pin', removePin);
router.post('/auth/lock', lockSession);

router.post('/auth/recovery/request', requestRecovery);
router.post('/auth/recovery/verify', verifyRecovery);
router.post('/auth/recovery-verify', verifyRecovery);
router.post('/auth/recovery/reset', resetPin);

module.exports = router;
