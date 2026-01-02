INSERT INTO crm_team_members (team_id, user_email, role, joined_at)
VALUES (@TeamId, @UserEmail, @Role, @JoinedAt);
SELECT LAST_INSERT_ID();