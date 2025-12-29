-- =========================
-- 4. Roles (scoped per App)
-- =========================
CREATE TABLE roles (
    RoleId INT AUTO_INCREMENT PRIMARY KEY,
    AppId INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT uq_roles_app_role UNIQUE (AppId, RoleName),
    FOREIGN KEY (AppId) REFERENCES applications(AppId) ON DELETE CASCADE
);