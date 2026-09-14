// src/db/pool.js
const mysql = require('mysql2/promise');
const { DB } = require('../config/env');

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB);
  }
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  closePool
};
