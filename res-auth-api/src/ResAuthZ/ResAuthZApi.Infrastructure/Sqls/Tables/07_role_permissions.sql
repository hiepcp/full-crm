-- =========================
-- 7. RolePermissions (mapping)
-- =========================
CREATE TABLE role_permissions (
    RoleId INT NOT NULL,
    PermissionId INT NOT NULL,
    PRIMARY KEY (RoleId, PermissionId),
    FOREIGN KEY (RoleId) REFERENCES roles(RoleId) ON DELETE CASCADE,
    FOREIGN KEY (PermissionId) REFERENCES permissions(PermissionId) ON DELETE CASCADE
);