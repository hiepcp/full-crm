-- =========================
-- 3. Resources (scoped per App)
-- =========================
CREATE TABLE resources (
    ResourceId INT AUTO_INCREMENT PRIMARY KEY,
    AppId INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Code VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT uq_resources_app_code UNIQUE (AppId, Code),
    FOREIGN KEY (AppId) REFERENCES applications(AppId) ON DELETE CASCADE
);