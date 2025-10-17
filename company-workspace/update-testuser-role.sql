-- Update testuser@gmail.com role from ADMIN to VIEWER
UPDATE users
SET role = 'VIEWER',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE email = 'testuser@gmail.com';

-- Verify the update
SELECT id, email, role, "createdAt", "updatedAt"
FROM users
WHERE email = 'testuser@gmail.com';
