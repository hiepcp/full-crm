-- =========================
-- 5. Permissions (Resource + Action) 
--    Code = ResourceCode + '.' + ActionCode (e.g. Product.ReadAll)
-- =========================
CREATE TABLE permissions (
    PermissionId INT AUTO_INCREMENT PRIMARY KEY,
    ResourceId INT NOT NULL,
    ActionId INT NOT NULL,
    Code VARCHAR(150) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT uq_permissions_res_action UNIQUE (ResourceId, ActionId),
    CONSTRAINT uq_permissions_code UNIQUE (Code),
    FOREIGN KEY (ResourceId) REFERENCES resources(ResourceId) ON DELETE CASCADE,
    FOREIGN KEY (ActionId) REFERENCES actions(ActionId) ON DELETE CASCADE
);

