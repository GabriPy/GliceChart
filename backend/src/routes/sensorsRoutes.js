// src/routes/sensorsRoutes.js
const express = require('express');
const router = express.Router();
const {
  listSensors,
  postSensor,
  stopSensor,
  removeSensor
} = require('../controllers/sensorsController');

router.get('/sensors', listSensors);
router.post('/sensors', postSensor);
router.put('/sensors/:id/end', stopSensor);
router.delete('/sensors/:id', removeSensor);

module.exports = router;
