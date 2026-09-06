CREATE TABLE IF NOT EXISTS recovery_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  token      VARCHAR(128) NOT NULL UNIQUE,
  chat_id    VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);
