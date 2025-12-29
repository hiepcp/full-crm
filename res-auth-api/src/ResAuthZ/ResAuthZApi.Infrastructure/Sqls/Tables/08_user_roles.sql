-- =========================
-- 08. UserRoles (assign user to role within app)
-- =========================
CREATE TABLE user_roles (
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    AppId INT NOT NULL,
    PRIMARY KEY (UserId, RoleId, AppId),
    FOREIGN KEY (UserId) REFERENCES users(UserId),
    FOREIGN KEY (RoleId) REFERENCES roles(RoleId),
    FOREIGN KEY (AppId) REFERENCES applications(AppId)
);