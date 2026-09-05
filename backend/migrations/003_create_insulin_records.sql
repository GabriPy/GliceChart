CREATE TABLE IF NOT EXISTS insulin_records (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  timestamp  DATETIME NOT NULL,
  type       ENUM('rapid', 'slow') NOT NULL,
  units      DECIMAL(4,1) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
);
