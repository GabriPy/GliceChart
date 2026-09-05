#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'glicechart',
    password: process.env.DB_PASSWORD || 'glicechart',
    database: process.env.DB_NAME || 'glicechart',
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Se la tabella di tracking non esiste, creala prima di leggere le migration
    const [tables] = await conn.execute(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'schema_migrations'
    `);
    if (!tables.length) {
      const initSql = fs.readFileSync(path.join(MIGRATIONS_DIR, '001_create_schema_migrations.sql'), 'utf8');
      await conn.query(initSql);
    }

    const [rows] = await conn.execute(`
      SELECT filename FROM schema_migrations ORDER BY filename ASC
    `);
    const executed = new Set(rows.map(r => r.filename));

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pending = files.filter(f => !executed.has(f));

    if (pending.length === 0) {
      console.log('✅ Nessuna migration pendente.');
      await conn.commit();
      return;
    }

    console.log(`📦 Migration da applicare: ${pending.join(', ')}`);

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      try {
        for (const stmt of statements) {
          await conn.query(stmt);
        }
        await conn.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
        console.log(`  ✔ ${file}`);
      } catch (err) {
        await conn.rollback();
        console.error(`  ✖ ${file} — ${err.message}`);
        process.exit(1);
      }
    }

    await conn.commit();
    console.log('✅ Migration completate.');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Errore migration:', err.message);
  process.exit(1);
});
