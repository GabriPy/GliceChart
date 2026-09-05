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
);
