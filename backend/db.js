// db.js - Connessione e query MySQL
const mysql = require('mysql2/promise');

let pool = null;

// Crea il pool di connessioni (viene riutilizzato per tutta la vita del server)
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306'),
      user:     process.env.DB_USER     || 'glucoview',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'glucoview',
      waitForConnections: true,
      connectionLimit: 10,
    });

    await initDB();
  }
  return pool;
}

// Crea la tabella se non esiste
async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS readings (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        timestamp  DATETIME NOT NULL,
        glucose    INT NOT NULL,
        trend      VARCHAR(20) NOT NULL,
        raw_trend  VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_timestamp (timestamp)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS insulin_records (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        timestamp  DATETIME NOT NULL,
        type       ENUM('rapid', 'slow') NOT NULL,
        units      DECIMAL(4,1) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS carb_records (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        timestamp  DATETIME NOT NULL,
        amount     INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id             INT PRIMARY KEY DEFAULT 1,
        tir_min        INT DEFAULT 70,
        tir_max        INT DEFAULT 180,
        red_under      INT DEFAULT 55,
        red_over       INT DEFAULT 250,
        rapid_duration      INT DEFAULT 3,
        slow_duration       INT DEFAULT 24,
        carb_duration       INT DEFAULT 4,
        insulin_sensitivity INT DEFAULT 60,
        carb_ratio          INT DEFAULT 15,
        quick_insulin_1     INT DEFAULT 1,
        quick_insulin_2     INT DEFAULT 2,
        quick_carb_1        INT DEFAULT 10,
        quick_carb_2        INT DEFAULT 20,
        CONSTRAINT one_row CHECK (id = 1)
      )
    `);

    // Migrazioni: Aggiunge le colonne se non esistono (per db già esistenti)
    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN red_under INT DEFAULT 55 AFTER tir_max`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN red_over INT DEFAULT 250 AFTER red_under`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN carb_duration INT DEFAULT 4 AFTER slow_duration`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN insulin_sensitivity INT DEFAULT 60 AFTER carb_duration`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN carb_ratio INT DEFAULT 15 AFTER insulin_sensitivity`);
    } catch (e) {}

    // Preset quick values: two insulin presets and two carb presets
    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN quick_insulin_1 INT DEFAULT 1 AFTER carb_ratio`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN quick_insulin_2 INT DEFAULT 2 AFTER quick_insulin_1`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN quick_carb_1 INT DEFAULT 10 AFTER quick_insulin_2`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN quick_carb_2 INT DEFAULT 20 AFTER quick_carb_1`);
    } catch (e) {}

    // Inserisce impostazioni di default se non esistono
    await conn.execute(`
      INSERT IGNORE INTO settings (id, tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2)
      VALUES (1, 70, 180, 55, 250, 3, 24, 4, 60, 15, 1, 2, 10, 20)
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        timestamp  DATETIME NOT NULL,
        text       VARCHAR(200) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS diet_foods (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        name           VARCHAR(100) NOT NULL,
        carbs_per_100g INT NOT NULL,
        category       ENUM('primo', 'secondo', 'contorno', 'frutta') DEFAULT 'contorno',
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_name (name)
      )
    `);

    // Migrazione: Aggiunge la colonna category se non esiste (per db già esistenti)
    try {
      await conn.execute(`ALTER TABLE diet_foods ADD COLUMN category ENUM('primo', 'secondo', 'contorno', 'frutta') DEFAULT 'contorno' AFTER carbs_per_100g`);
    } catch (e) {
      // La colonna probabilmente esiste già
    }

    // Inserisce/Aggiorna dati richiesti dall'utente
    const foods = [
      { name: 'Pasta', carbs: 70, cat: 'primo' },
      { name: 'Riso', carbs: 80, cat: 'primo' },
      { name: 'Pane', carbs: 50, cat: 'contorno' },
      { name: 'Pesca', carbs: 9, cat: 'frutta' }
    ];

    for (const f of foods) {
      await conn.execute(
        `INSERT INTO diet_foods (name, carbs_per_100g, category) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE category = VALUES(category), carbs_per_100g = VALUES(carbs_per_100g)`,
        [f.name, f.carbs, f.cat]
      );
    }

    console.log('✅ Tabelle MySQL pronte');
  } finally {
    conn.release();
  }
}

// Inserisce una lettura (aggiorna se il timestamp esiste già)
async function insertReading({ timestamp, glucose, trend, raw_trend }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO readings (timestamp, glucose, trend, raw_trend)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     glucose = VALUES(glucose),
     trend = VALUES(trend),
     raw_trend = VALUES(raw_trend)`,
    [new Date(timestamp), glucose, trend, raw_trend]
  );
  return result.affectedRows > 0;
}

// Letture degli ultimi N minuti
async function getReadingsByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  // Converte i Date di MySQL in stringhe ISO per coerenza con il frontend
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// Ultima lettura disponibile
async function getLatestReading() {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
     ORDER BY timestamp DESC
     LIMIT 1`
  );
  if (!rows.length) return null;
  return {
    ...rows[0],
    timestamp: new Date(rows[0].timestamp).toISOString(),
  };
}

// Inserisce una somministrazione di insulina
async function insertInsulin({ timestamp, type, units }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO insulin_records (timestamp, type, units)
     VALUES (?, ?, ?)`,
    [new Date(timestamp), type, units]
  );
  return result.insertId;
}

// Recupera somministrazioni di insulina negli ultimi N minuti
async function getInsulinByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, type, units
     FROM insulin_records
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// Elimina un record di insulina
async function deleteInsulin(id) {
  const p = await getPool();
  const [result] = await p.execute(
    `DELETE FROM insulin_records WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

// Aggiorna un record di insulina
async function updateInsulin(id, { timestamp, type, units }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE insulin_records 
     SET timestamp = ?, type = ?, units = ?
     WHERE id = ?`,
    [new Date(timestamp), type, units, id]
  );
  return result.affectedRows > 0;
}

// Recupera letture per una data specifica (YYYY-MM-DD)
async function getReadingsByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
     WHERE DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// Recupera insuline per una data specifica (YYYY-MM-DD)
async function getInsulinByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, type, units
     FROM insulin_records
     WHERE DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// Recupera insuline che si sovrappongono a una data specifica (YYYY-MM-DD)
async function getInsulinOverlappingDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT ir.id, ir.timestamp, ir.type, ir.units
     FROM insulin_records ir
     CROSS JOIN settings s
     WHERE ir.timestamp < DATE_ADD(?, INTERVAL 1 DAY)
       AND DATE_ADD(
         ir.timestamp,
         INTERVAL CASE
           WHEN ir.type = 'rapid' THEN COALESCE(s.rapid_duration, 3)
           ELSE COALESCE(s.slow_duration, 24)
         END HOUR
       ) > ?
     ORDER BY ir.timestamp ASC`,
    [date, date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// ── Carboidrati (CHO) ────────────────────────────────────────────────────────
async function insertCarb({ timestamp, amount }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO carb_records (timestamp, amount) VALUES (?, ?)`,
    [new Date(timestamp), amount]
  );
  return result.insertId;
}

async function getCarbsByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, amount
     FROM carb_records
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function deleteCarb(id) {
  const p = await getPool();
  const [result] = await p.execute(`DELETE FROM carb_records WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function updateCarb(id, { timestamp, amount }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE carb_records SET timestamp = ?, amount = ? WHERE id = ?`,
    [new Date(timestamp), amount, id]
  );
  return result.affectedRows > 0;
}

async function getCarbsByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, amount
     FROM carb_records
     WHERE DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// ── Note / Eventi ────────────────────────────────────────────────────────────
async function insertNote({ timestamp, text }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO notes (timestamp, text) VALUES (?, ?)`,
    [new Date(timestamp), text]
  );
  return result.insertId;
}

async function getNotesByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, text
     FROM notes
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function deleteNote(id) {
  const p = await getPool();
  const [result] = await p.execute(`DELETE FROM notes WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function updateNote(id, { timestamp, text }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE notes SET timestamp = ?, text = ? WHERE id = ?`,
    [new Date(timestamp), text, id]
  );
  return result.affectedRows > 0;
}

async function getNotesByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, text
     FROM notes
     WHERE DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// ── Dietometro ───────────────────────────────────────────────────────────────
async function getDietFoods() {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, name, carbs_per_100g, category FROM diet_foods ORDER BY category ASC, name ASC`
  );
  return rows;
}

async function insertDietFood({ name, carbs_per_100g, category }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO diet_foods (name, carbs_per_100g, category) VALUES (?, ?, ?)`,
    [name, carbs_per_100g, category || 'contorno']
  );
  return result.insertId;
}

// ── Impostazioni (Settings) ──────────────────────────────────────────────────
async function getSettings() {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT * FROM settings WHERE id = 1`);
  return rows[0];
}

async function updateSettings({ tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2 }) {
  const p = await getPool();
  // Ulteriore controllo di sicurezza sui valori di default
  const finalTirMin = tir_min ?? 70;
  const finalTirMax = tir_max ?? 180;
  const finalRedUnder = red_under ?? 55;
  const finalRedOver = red_over ?? 250;
  const finalRapid = rapid_duration ?? 3;
  const finalSlow = slow_duration ?? 24;
  const finalCarbDuration = carb_duration ?? 4;
  const finalInsulinSensitivity = insulin_sensitivity ?? 60;
  const finalCarbRatio = carb_ratio ?? 15;
  const finalQuickIns1 = quick_insulin_1 ?? 1;
  const finalQuickIns2 = quick_insulin_2 ?? 2;
  const finalQuickCarb1 = quick_carb_1 ?? 10;
  const finalQuickCarb2 = quick_carb_2 ?? 20;

  const [result] = await p.execute(
    `UPDATE settings 
     SET tir_min = ?, tir_max = ?, red_under = ?, red_over = ?, rapid_duration = ?, slow_duration = ?, carb_duration = ?, insulin_sensitivity = ?, carb_ratio = ?, quick_insulin_1 = ?, quick_insulin_2 = ?, quick_carb_1 = ?, quick_carb_2 = ?
     WHERE id = 1`,
    [finalTirMin, finalTirMax, finalRedUnder, finalRedOver, finalRapid, finalSlow, finalCarbDuration, finalInsulinSensitivity, finalCarbRatio, finalQuickIns1, finalQuickIns2, finalQuickCarb1, finalQuickCarb2]
  );
  return result.affectedRows > 0;
}

module.exports = { 
  getPool, 
  insertReading, 
  getReadingsByMinutes, 
  getLatestReading,
  insertInsulin,
  getInsulinByMinutes,
  deleteInsulin,
  updateInsulin,
  getReadingsByDate,
  getInsulinByDate,
  getInsulinOverlappingDate,
  insertCarb,
  getCarbsByMinutes,
  deleteCarb,
  updateCarb,
  getCarbsByDate,
   insertNote,
   deleteNote,
   updateNote,
   getNotesByMinutes,
  getNotesByDate,
  getDietFoods,
  insertDietFood,
  getSettings,
  updateSettings
};
