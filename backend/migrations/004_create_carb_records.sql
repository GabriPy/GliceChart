CREATE TABLE IF NOT EXISTS carb_records (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  timestamp  DATETIME NOT NULL,
  amount     INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
);
