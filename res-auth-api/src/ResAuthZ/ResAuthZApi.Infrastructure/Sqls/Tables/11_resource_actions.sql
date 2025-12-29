CREATE TABLE resource_actions (
    ResourceId INT NOT NULL,
    ActionId INT NOT NULL,
    PRIMARY KEY (ResourceId, ActionId),
    FOREIGN KEY (ResourceId) REFERENCES resources(ResourceId),
    FOREIGN KEY (ActionId) REFERENCES actions(ActionId)
);