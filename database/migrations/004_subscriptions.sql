BEGIN;

CREATE TABLE subscriptions (
    code VARCHAR(32) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_cop NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (price_cop >= 0),
    max_users INTEGER CHECK (max_users IS NULL OR max_users > 0),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO subscriptions (code, name, description, price_cop, max_users, features)
VALUES
    ('FREE', 'Gratuita', 'Acceso inicial para explorar la plataforma.', 0, 1, '["Dashboard", "Activos", "Oportunidades"]'::jsonb),
    ('PRO', 'Profesional', 'Herramientas comerciales y operativas para equipos en crecimiento.', 0, 10, '["Dashboard", "Activos", "Oportunidades", "Acuerdos", "Compromisos", "Evidencias", "Reportes"]'::jsonb),
    ('ENTERPRISE', 'Empresarial', 'Configuración ampliada para organizaciones deportivas.', 0, NULL, '["Todos los módulos", "Usuarios ilimitados", "Soporte prioritario"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE auth_credentials
    ADD COLUMN subscription_type VARCHAR(32);

UPDATE auth_credentials
SET subscription_type = 'FREE'
WHERE subscription_type IS NULL;

ALTER TABLE auth_credentials
    ALTER COLUMN subscription_type SET DEFAULT 'FREE',
    ALTER COLUMN subscription_type SET NOT NULL,
    ADD CONSTRAINT auth_credentials_subscription_fk
        FOREIGN KEY (subscription_type) REFERENCES subscriptions(code);

CREATE INDEX auth_credentials_subscription_idx ON auth_credentials(subscription_type);

COMMENT ON COLUMN auth_credentials.subscription_type IS 'Código del plan asignado a la cuenta; las cuentas nuevas comienzan en FREE.';

COMMIT;