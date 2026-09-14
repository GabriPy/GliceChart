// src/services/migrationRunner.js
const fs = require('fs');
const path = require('path');
const { getPool } = require('../db/pool');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', 'migrations');

async function runMigrations() {
  const pool = await getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Crea tabella tracking se non esiste
    const [tables] = await conn.execute(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'schema_migrations'
    `);

    if (!tables.length) {
      const initFile = path.join(MIGRATIONS_DIR, '001_create_schema_migrations.sql');
      if (fs.existsSync(initFile)) {
        const initSql = fs.readFileSync(initFile, 'utf8');
        await conn.query(initSql);
      }
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
      return { count: 0 };
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
        throw err;
      }
    }

    await conn.commit();
    console.log('✅ Migration completate con successo.');
    return { count: pending.length };
  } finally {
    conn.release();
  }
}

module.exports = {
  runMigrations
};
