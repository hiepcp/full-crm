-- =========================
-- 4. Actions (global)
-- =========================
CREATE TABLE actions (
    ActionId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Code VARCHAR(100) NOT NULL UNIQUE
);