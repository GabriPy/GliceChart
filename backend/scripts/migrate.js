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
      try {
        await conn.query(sql);
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
