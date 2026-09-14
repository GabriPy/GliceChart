// src/db/queries/dietQueries.js
const { getPool } = require('../pool');

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

module.exports = {
  getDietFoods,
  insertDietFood
};
