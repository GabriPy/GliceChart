CREATE TABLE IF NOT EXISTS diet_foods (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  carbs_per_100g INT NOT NULL,
  category       ENUM('primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno') DEFAULT 'contorni',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_name (name)
);
