// src/controllers/dietController.js
const { getDietFoods, insertDietFood } = require('../db/queries/dietQueries');

async function getFoods(req, res, next) {
  try {
    const rows = await getDietFoods();
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function postFood(req, res, next) {
  const { name, carbs_per_100g, category } = req.body || {};
  const finalName = String(name || '').trim();
  const carbs = Number(carbs_per_100g);
  const finalCat = String(category || 'contorni').trim().toLowerCase();

  const validCats = ['primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno'];
  if (!validCats.includes(finalCat)) {
    return res.status(400).json({ error: 'Categoria non valida' });
  }

  if (!finalName) return res.status(400).json({ error: 'Nome mancante' });
  if (!Number.isFinite(carbs)) return res.status(400).json({ error: 'CHO non valido' });
  if (carbs < 0 || carbs > 100) return res.status(400).json({ error: 'CHO fuori range' });

  try {
    const id = await insertDietFood({ 
      name: finalName, 
      carbs_per_100g: Math.round(carbs),
      category: finalCat
    });
    res.json({ ok: true, id });
  } catch (e) {
    if (String(e.message || '').includes('uq_name')) {
      return res.status(409).json({ error: 'Nome già esistente' });
    }
    next(e);
  }
}

module.exports = {
  getFoods,
  postFood
};
