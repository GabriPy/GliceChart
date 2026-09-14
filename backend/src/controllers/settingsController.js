// src/controllers/settingsController.js
const { getSettings, updateSettings } = require('../db/queries/settingsQueries');

async function fetchSettings(req, res, next) {
  try {
    const settings = await getSettings();
    const { pin_hash, ...safe } = settings || {};
    res.json(safe);
  } catch (e) {
    next(e);
  }
}

async function modifySettings(req, res, next) {
  try {
    const ok = await updateSettings(req.body || {});
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  fetchSettings,
  modifySettings
};
