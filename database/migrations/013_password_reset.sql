BEGIN;

ALTER TABLE auth_credentials
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expires_at TIMESTAMPTZ;

CREATE INDEX auth_credentials_reset_token_idx
    ON auth_credentials (reset_token)
    WHERE reset_token IS NOT NULL;

COMMENT ON COLUMN auth_credentials.reset_token IS 'Token temporal para recuperación de contraseña.';
COMMENT ON COLUMN auth_credentials.reset_token_expires_at IS 'Fecha y hora de expiración del token de recuperación.';

COMMIT;
