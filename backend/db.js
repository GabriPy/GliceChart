// db.js - Connessione e query MySQL
const mysql = require('mysql2/promise');

let pool = null;

// Crea il pool di connessioni (viene riutilizzato per tutta la vita del server)
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306'),
      user:     process.env.DB_USER     || 'glicechart',
      password: process.env.DB_PASSWORD || 'glicechart',
      database: process.env.DB_NAME     || 'glicechart',
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
        id                         INT PRIMARY KEY DEFAULT 1,
        tir_min                    INT DEFAULT 70,
        tir_max                    INT DEFAULT 180,
        red_under                  INT DEFAULT 55,
        red_over                   INT DEFAULT 250,
        rapid_duration            INT DEFAULT 3,
        slow_duration             INT DEFAULT 24,
        carb_duration             INT DEFAULT 4,
        insulin_sensitivity       INT DEFAULT 60,
        carb_ratio                INT DEFAULT 15,
        quick_insulin_1           INT DEFAULT 1,
        quick_insulin_2           INT DEFAULT 2,
        quick_carb_1              INT DEFAULT 10,
        quick_carb_2              INT DEFAULT 20,
        telegram_enabled          BOOLEAN DEFAULT FALSE,
        telegram_high_low_alerts  BOOLEAN DEFAULT TRUE,
        telegram_prediction_alerts BOOLEAN DEFAULT TRUE,
        telegram_insulin_alerts   BOOLEAN DEFAULT FALSE,
        telegram_carb_alerts      BOOLEAN DEFAULT FALSE,
        telegram_daily_summary    BOOLEAN DEFAULT FALSE,
        telegram_daily_summary_time VARCHAR(5) DEFAULT '21:00',
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

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_enabled BOOLEAN DEFAULT FALSE AFTER quick_carb_2`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_high_low_alerts BOOLEAN DEFAULT TRUE AFTER telegram_enabled`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_prediction_alerts BOOLEAN DEFAULT TRUE AFTER telegram_high_low_alerts`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_insulin_alerts BOOLEAN DEFAULT FALSE AFTER telegram_prediction_alerts`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_carb_alerts BOOLEAN DEFAULT FALSE AFTER telegram_insulin_alerts`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_daily_summary BOOLEAN DEFAULT FALSE AFTER telegram_carb_alerts`);
    } catch (e) {}

    try {
      await conn.execute(`ALTER TABLE settings ADD COLUMN telegram_daily_summary_time VARCHAR(5) DEFAULT '21:00' AFTER telegram_daily_summary`);
    } catch (e) {}

    // Inserisce impostazioni di default se non esistono
    await conn.execute(`
      INSERT IGNORE INTO settings (id, tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2, telegram_enabled, telegram_high_low_alerts, telegram_prediction_alerts, telegram_insulin_alerts, telegram_carb_alerts, telegram_daily_summary, telegram_daily_summary_time)
      VALUES (1, 70, 180, 55, 250, 3, 24, 4, 60, 15, 1, 2, 10, 20, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, '21:00')
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
        category       ENUM('primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno') DEFAULT 'contorni',
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_name (name)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sensors (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        serial_number   VARCHAR(100) NOT NULL,
        lot_number      VARCHAR(100),
        start_date      DATETIME NOT NULL,
        end_date        DATETIME GENERATED ALWAYS AS (DATE_ADD(start_date, INTERVAL 15 DAY)) STORED,
        actual_end_date DATETIME,
        early_end_note  VARCHAR(500),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_start_date (start_date),
        INDEX idx_actual_end_date (actual_end_date)
      )
    `);

    // Migrazione: Aggiunge la colonna category se non esiste (per db già esistenti)
    try {
      await conn.execute(`ALTER TABLE diet_foods ADD COLUMN category ENUM('primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno', 'primo', 'secondo', 'contorno') DEFAULT 'contorni' AFTER carbs_per_100g`);
    } catch (e) {
      // La colonna probabilmente esiste già
    }

    // Migrazione: allarga temporaneamente l'ENUM per includere sia i vecchi che i nuovi
    // valori, così le UPDATE di conversione sotto non falliscono per valore non ammesso.
    // IMPORTANTE: questo step deve avvenire PRIMA delle UPDATE, altrimenti 'primi'/'secondi'/
    // 'contorni' vengono rifiutati dal vecchio ENUM e l'intero blocco fallisce silenziosamente,
    // lasciando l'ENUM non aggiornato per sempre (causa dell'errore "Data truncated").
    try {
      await conn.execute(`ALTER TABLE diet_foods MODIFY COLUMN category ENUM('primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno', 'primo', 'secondo', 'contorno') DEFAULT 'contorni'`);
    } catch (e) {
      // ENUM già ampliata o errore non bloccante
    }

    // Migrazione: converte i vecchi valori (singolare) nei nuovi (plurale).
    // Ogni UPDATE ha il proprio try/catch: se uno fallisce, gli altri vengono eseguiti comunque.
    try { await conn.execute(`UPDATE diet_foods SET category = 'primi'    WHERE category = 'primo'`);    } catch (e) {}
    try { await conn.execute(`UPDATE diet_foods SET category = 'secondi' WHERE category = 'secondo'`);  } catch (e) {}
    try { await conn.execute(`UPDATE diet_foods SET category = 'contorni' WHERE category = 'contorno'`); } catch (e) {}

    // Migrazione: restringe l'ENUM ai soli valori finali, ora che i dati sono stati convertiti
    try {
      await conn.execute(`ALTER TABLE diet_foods MODIFY COLUMN category ENUM('primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno') DEFAULT 'contorni'`);
    } catch (e) {
      // ENUM già aggiornata o errore non bloccante
    }

    // Inserisce/Aggiorna dati richiesti dall'utente (compresi alimenti_nuovi.json)
    const foods = [
      // Base storici
      { name: 'Pasta', carbs: 70, cat: 'primi' },
      { name: 'Riso', carbs: 80, cat: 'primi' },
      { name: 'Pane', carbs: 50, cat: 'contorni' },
      { name: 'Pesca', carbs: 9, cat: 'frutta' },
      // Primi
      { name: 'Gnocchi di patate', carbs: 30, cat: 'primi' },
      { name: 'Cous cous', carbs: 73, cat: 'primi' },
      { name: 'Farro', carbs: 67, cat: 'primi' },
      { name: 'Orzo', carbs: 73, cat: 'primi' },
      { name: 'Quinoa', carbs: 64, cat: 'primi' },
      { name: 'Avena', carbs: 60, cat: 'primi' },
      { name: 'Patate', carbs: 17, cat: 'primi' },
      { name: 'Patate dolci', carbs: 20, cat: 'primi' },
      { name: 'Lasagne', carbs: 25, cat: 'primi' },
      { name: 'Ravioli', carbs: 30, cat: 'primi' },
      { name: 'Tortellini', carbs: 35, cat: 'primi' },
      // Secondi
      { name: 'Prosciutto cotto', carbs: 1, cat: 'secondi' },
      { name: 'Prosciutto crudo', carbs: 1, cat: 'secondi' },
      { name: 'Mortadella', carbs: 1, cat: 'secondi' },
      { name: 'Salsiccia', carbs: 2, cat: 'secondi' },
      { name: 'Hamburger', carbs: 2, cat: 'secondi' },
      { name: 'Polpette', carbs: 5, cat: 'secondi' },
      { name: 'Wurstel', carbs: 3, cat: 'secondi' },
      // Contorni
      { name: 'Carote', carbs: 10, cat: 'contorni' },
      { name: 'Piselli', carbs: 14, cat: 'contorni' },
      { name: 'Mais', carbs: 19, cat: 'contorni' },
      { name: 'Zucca', carbs: 7, cat: 'contorni' },
      { name: 'Cipolle', carbs: 9, cat: 'contorni' },
      { name: 'Pomodori', carbs: 4, cat: 'contorni' },
      { name: 'Zucchine', carbs: 3, cat: 'contorni' },
      { name: 'Melanzane', carbs: 6, cat: 'contorni' },
      { name: 'Peperoni', carbs: 6, cat: 'contorni' },
      { name: 'Broccoli', carbs: 4, cat: 'contorni' },
      { name: 'Cavolfiore', carbs: 5, cat: 'contorni' },
      { name: 'Fagiolini', carbs: 4, cat: 'contorni' },
      { name: 'Funghi', carbs: 2, cat: 'contorni' },
      // Frutta
      { name: 'Mela', carbs: 14, cat: 'frutta' },
      { name: 'Pera', carbs: 15, cat: 'frutta' },
      { name: 'Banana', carbs: 23, cat: 'frutta' },
      { name: 'Albicocca', carbs: 11, cat: 'frutta' },
      { name: 'Arancia', carbs: 12, cat: 'frutta' },
      { name: 'Mandarino', carbs: 13, cat: 'frutta' },
      { name: 'Kiwi', carbs: 15, cat: 'frutta' },
      { name: 'Fragole', carbs: 8, cat: 'frutta' },
      { name: 'Ciliegie', carbs: 16, cat: 'frutta' },
      { name: 'Uva', carbs: 18, cat: 'frutta' },
      { name: 'Anguria', carbs: 8, cat: 'frutta' },
      { name: 'Melone', carbs: 8, cat: 'frutta' },
      { name: 'Ananas', carbs: 13, cat: 'frutta' },
      { name: 'Mango', carbs: 15, cat: 'frutta' },
      // Latticini
      { name: 'Latte intero', carbs: 5, cat: 'latticini' },
      { name: 'Latte scremato', carbs: 5, cat: 'latticini' },
      { name: 'Yogurt bianco', carbs: 5, cat: 'latticini' },
      { name: 'Yogurt alla frutta', carbs: 15, cat: 'latticini' },
      { name: 'Yogurt greco', carbs: 4, cat: 'latticini' },
      { name: 'Mozzarella', carbs: 1, cat: 'latticini' },
      { name: 'Ricotta', carbs: 3, cat: 'latticini' },
      { name: 'Formaggio spalmabile', carbs: 4, cat: 'latticini' },
      { name: 'Budino', carbs: 15, cat: 'latticini' },
      // Bevande
      { name: 'Succo di frutta', carbs: 11, cat: 'bevande' },
      { name: 'Coca Cola', carbs: 11, cat: 'bevande' },
      { name: 'Aranciata', carbs: 10, cat: 'bevande' },
      { name: 'Tè zuccherato', carbs: 8, cat: 'bevande' },
      { name: 'Latte e cacao', carbs: 12, cat: 'bevande' },
      { name: 'Frullato di frutta', carbs: 15, cat: 'bevande' },
      // Prodotti da forno
      { name: 'Pizza margherita', carbs: 30, cat: 'prodotti_da_forno' },
      { name: 'Focaccia', carbs: 50, cat: 'prodotti_da_forno' },
      { name: 'Piadina', carbs: 55, cat: 'prodotti_da_forno' },
      { name: 'Cracker', carbs: 65, cat: 'prodotti_da_forno' },
      { name: 'Grissini', carbs: 70, cat: 'prodotti_da_forno' },
      { name: 'Biscotti secchi', carbs: 73, cat: 'prodotti_da_forno' },
      { name: 'Cornetto', carbs: 50, cat: 'prodotti_da_forno' },
      { name: 'Panino', carbs: 55, cat: 'prodotti_da_forno' },
      { name: 'Crostata', carbs: 45, cat: 'prodotti_da_forno' }
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
    [name, carbs_per_100g, category || 'contorni']
  );
  return result.insertId;
}

// ── Sensori ───────────────────────────────────────────────────────────────
async function insertSensor({ serial_number, lot_number, start_date }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO sensors (serial_number, lot_number, start_date) VALUES (?, ?, ?)`,
    [serial_number, lot_number, new Date(start_date)]
  );
  return result.insertId;
}

async function getSensors() {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, serial_number, lot_number, start_date, end_date, actual_end_date, early_end_note, created_at
     FROM sensors
     ORDER BY start_date DESC`
  );
  return rows.map(r => ({
    ...r,
    start_date: new Date(r.start_date).toISOString(),
    end_date: new Date(r.end_date).toISOString(),
    actual_end_date: r.actual_end_date ? new Date(r.actual_end_date).toISOString() : null,
    created_at: new Date(r.created_at).toISOString()
  }));
}

async function endSensor(id, { actual_end_date, early_end_note }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE sensors 
     SET actual_end_date = ?, early_end_note = ?
     WHERE id = ? AND actual_end_date IS NULL`,
    [new Date(actual_end_date), early_end_note || null, id]
  );
  return result.affectedRows > 0;
}

async function deleteSensor(id) {
  const p = await getPool();
  const [result] = await p.execute(
    `DELETE FROM sensors WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

// ── Impostazioni (Settings) ──────────────────────────────────────────────────
async function getSettings() {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT * FROM settings WHERE id = 1`);
  return rows[0];
}

async function updateSettings({ tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2, telegram_enabled, telegram_high_low_alerts, telegram_prediction_alerts, telegram_insulin_alerts, telegram_carb_alerts, telegram_daily_summary, telegram_daily_summary_time }) {
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
  const finalTelegramEnabled = telegram_enabled ?? false;
  const finalTelegramHighLow = telegram_high_low_alerts ?? true;
  const finalTelegramPrediction = telegram_prediction_alerts ?? true;
  const finalTelegramInsulin = telegram_insulin_alerts ?? false;
  const finalTelegramCarb = telegram_carb_alerts ?? false;
  const finalTelegramDaily = telegram_daily_summary ?? false;
  const finalDailySummaryTime = telegram_daily_summary_time || '21:00';

  const [result] = await p.execute(
    `UPDATE settings 
     SET tir_min = ?, tir_max = ?, red_under = ?, red_over = ?, rapid_duration = ?, slow_duration = ?, carb_duration = ?, insulin_sensitivity = ?, carb_ratio = ?, quick_insulin_1 = ?, quick_insulin_2 = ?, quick_carb_1 = ?, quick_carb_2 = ?, telegram_enabled = ?, telegram_high_low_alerts = ?, telegram_prediction_alerts = ?, telegram_insulin_alerts = ?, telegram_carb_alerts = ?, telegram_daily_summary = ?, telegram_daily_summary_time = ?
     WHERE id = 1`,
    [finalTirMin, finalTirMax, finalRedUnder, finalRedOver, finalRapid, finalSlow, finalCarbDuration, finalInsulinSensitivity, finalCarbRatio, finalQuickIns1, finalQuickIns2, finalQuickCarb1, finalQuickCarb2, finalTelegramEnabled, finalTelegramHighLow, finalTelegramPrediction, finalTelegramInsulin, finalTelegramCarb, finalTelegramDaily, finalDailySummaryTime]
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
   getNotesByMinutes,
  getNotesByDate,
  getDietFoods,
  insertDietFood,
  insertSensor,
  getSensors,
  endSensor,
  deleteSensor,
  getSettings,
  updateSettings
};