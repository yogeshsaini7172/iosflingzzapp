-- Enable leaked password protection (security warning fix)
UPDATE auth.config 
SET value = 'true' 
WHERE parameter = 'password_leaked_password_protection';

-- If the config doesn't exist, insert it
INSERT INTO auth.config (parameter, value)
SELECT 'password_leaked_password_protection', 'true'
WHERE NOT EXISTS (
    SELECT 1 FROM auth.config 
    WHERE parameter = 'password_leaked_password_protection'
);