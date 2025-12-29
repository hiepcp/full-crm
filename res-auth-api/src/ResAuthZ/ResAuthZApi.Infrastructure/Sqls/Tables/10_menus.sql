CREATE TABLE menus (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ParentId INT NULL,
    Code VARCHAR(100) NOT NULL UNIQUE,
    Name VARCHAR(200) NOT NULL,
    Icon VARCHAR(100) NULL,
    HideInMenu BOOLEAN NOT NULL DEFAULT FALSE,
    Url VARCHAR(255) NULL,   
    ResourceId INT NULL,
    AppId INT NOT NULL,
    SortOrder INT DEFAULT 0,
    CONSTRAINT fk_menu_parent FOREIGN KEY (ParentId) REFERENCES menus(Id),
    CONSTRAINT fk_menu_resource FOREIGN KEY (ResourceId) REFERENCES resources(ResourceId),
    CONSTRAINT fk_menu_app FOREIGN KEY (AppId) REFERENCES applications(AppId)
);
