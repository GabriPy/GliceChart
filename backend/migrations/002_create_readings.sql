CREATE TABLE IF NOT EXISTS readings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  timestamp  DATETIME NOT NULL,
  glucose    INT NOT NULL,
  trend      VARCHAR(20) NOT NULL,
  raw_trend  VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_timestamp (timestamp)
);
