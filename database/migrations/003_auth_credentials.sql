BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE auth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    username TEXT,
    password_hash TEXT NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT auth_credentials_identifier_required CHECK (email IS NOT NULL OR username IS NOT NULL),
    CONSTRAINT auth_credentials_valid_period CHECK (valid_until > valid_from),
    CONSTRAINT auth_credentials_email_format CHECK (email IS NULL OR POSITION('@' IN email) > 1),
    CONSTRAINT auth_credentials_password_hash_not_empty CHECK (LENGTH(TRIM(password_hash)) > 0)
);

CREATE UNIQUE INDEX auth_credentials_email_unique
    ON auth_credentials (LOWER(email))
    WHERE email IS NOT NULL;

CREATE UNIQUE INDEX auth_credentials_username_unique
    ON auth_credentials (LOWER(username))
    WHERE username IS NOT NULL;

CREATE INDEX auth_credentials_validity_idx
    ON auth_credentials (valid_from, valid_until);

COMMENT ON TABLE auth_credentials IS 'Credenciales de acceso. password_hash debe contener un hash Argon2id o bcrypt, nunca una contraseña en texto plano.';
COMMENT ON COLUMN auth_credentials.valid_until IS 'Fecha y hora exclusiva de expiración de la credencial.';

COMMIT;