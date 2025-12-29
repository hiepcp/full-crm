-- =========================
-- 1. Applications
-- =========================
CREATE TABLE applications (
    AppId INT AUTO_INCREMENT PRIMARY KEY,
    AppCode VARCHAR(50) NOT NULL UNIQUE,
    AppName VARCHAR(200) NOT NULL
);