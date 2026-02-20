CREATE DATABASE IF NOT EXISTS gloomy_wol
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE gloomy_wol;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  user_uuid VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 리프레시 토큰 테이블
CREATE TABLE IF NOT EXISTS refresh_tokens (
  refresh_token_uuid VARCHAR(36) PRIMARY KEY,
  user_uuid VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_uuid) REFERENCES users(user_uuid)
    ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_uuid);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- 장치 테이블
CREATE TABLE IF NOT EXISTS devices (
  device_uuid VARCHAR(36) PRIMARY KEY,
  user_uuid VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  mac_address VARCHAR(17) NOT NULL,
  ip_address VARCHAR(45) NULL,
  broadcast_address VARCHAR(45) NOT NULL DEFAULT '192.168.0.255',
  port INT NOT NULL DEFAULT 9,
  memo TEXT NULL,
  repeat_count INT NOT NULL DEFAULT 3,
  repeat_interval_ms INT NOT NULL DEFAULT 500,
  last_status ENUM('online', 'offline', 'unknown') NOT NULL DEFAULT 'unknown',
  last_status_checked_at DATETIME NULL,
  is_favorite TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_devices_user
    FOREIGN KEY (user_uuid) REFERENCES users(user_uuid)
    ON DELETE CASCADE
);

CREATE INDEX idx_devices_user ON devices(user_uuid);
CREATE INDEX idx_devices_mac ON devices(mac_address);

-- WoL 이력 테이블
CREATE TABLE IF NOT EXISTS wol_history (
  history_uuid VARCHAR(36) PRIMARY KEY,
  device_uuid VARCHAR(36) NOT NULL,
  user_uuid VARCHAR(36) NOT NULL,
  result ENUM('success', 'failure') NOT NULL,
  error_message TEXT NULL,
  device_responded_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_device
    FOREIGN KEY (device_uuid) REFERENCES devices(device_uuid)
    ON DELETE CASCADE,
  CONSTRAINT fk_history_user
    FOREIGN KEY (user_uuid) REFERENCES users(user_uuid)
    ON DELETE CASCADE
);

CREATE INDEX idx_history_device ON wol_history(device_uuid);
CREATE INDEX idx_history_user ON wol_history(user_uuid);
CREATE INDEX idx_history_created ON wol_history(created_at);
