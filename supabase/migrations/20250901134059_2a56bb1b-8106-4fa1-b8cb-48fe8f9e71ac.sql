-- Update auth configuration to use OTP instead of magic links
UPDATE auth.config 
SET 
  mailer_templates = jsonb_set(
    COALESCE(mailer_templates, '{}'),
    '{confirm}',
    '{
      "subject": "Confirm your signup",
      "template": "<!DOCTYPE html><html><head><title>Confirm signup</title></head><body><h2>Confirm your signup</h2><p>Your verification code is: <strong>{{ .Token }}</strong></p><p>Enter this code in the app to complete your signup.</p></body></html>"
    }'
  ),
  enable_signup = true,
  enable_confirmations = true,
  enable_phone_confirmations = false
WHERE id = 1;

-- Insert default config if it doesn't exist
INSERT INTO auth.config (
  id,
  enable_signup,
  enable_confirmations,
  enable_phone_confirmations,
  mailer_templates
) VALUES (
  1,
  true,
  true,
  false,
  '{
    "confirm": {
      "subject": "Confirm your signup",
      "template": "<!DOCTYPE html><html><head><title>Confirm signup</title></head><body><h2>Confirm your signup</h2><p>Your verification code is: <strong>{{ .Token }}</strong></p><p>Enter this code in the app to complete your signup.</p></body></html>"
    }
  }'
) ON CONFLICT (id) DO UPDATE SET
  enable_signup = EXCLUDED.enable_signup,
  enable_confirmations = EXCLUDED.enable_confirmations,
  enable_phone_confirmations = EXCLUDED.enable_phone_confirmations,
  mailer_templates = EXCLUDED.mailer_templates;