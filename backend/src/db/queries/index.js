// src/db/queries/index.js
const { getPool, closePool } = require('../pool');
const readingsQueries = require('./readingsQueries');
const insulinQueries = require('./insulinQueries');
const carbsQueries = require('./carbsQueries');
const notesQueries = require('./notesQueries');
const sensorsQueries = require('./sensorsQueries');
const dietQueries = require('./dietQueries');
const settingsQueries = require('./settingsQueries');
const authQueries = require('./authQueries');

module.exports = {
  getPool,
  closePool,
  ...readingsQueries,
  ...insulinQueries,
  ...carbsQueries,
  ...notesQueries,
  ...sensorsQueries,
  ...dietQueries,
  ...settingsQueries,
  ...authQueries
};
