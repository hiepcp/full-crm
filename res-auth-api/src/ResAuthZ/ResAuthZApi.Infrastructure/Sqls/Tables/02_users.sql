-- =========================
-- 2. Users
-- =========================
CREATE TABLE users (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(200) NOT NULL UNIQUE,
    UserName VARCHAR(200) NULL
    FullName VARCHAR(200) NULL
);