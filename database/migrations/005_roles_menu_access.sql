BEGIN;

CREATE TABLE roles (
    code VARCHAR(32) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_options (
    code VARCHAR(64) PRIMARY KEY,
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    icon VARCHAR(64),
    sort_order SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscription_menu_access (
    subscription_type VARCHAR(32) NOT NULL REFERENCES subscriptions(code) ON DELETE CASCADE,
    menu_option_code VARCHAR(64) NOT NULL REFERENCES menu_options(code) ON DELETE CASCADE,
    role_code VARCHAR(32) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
    PRIMARY KEY (subscription_type, menu_option_code, role_code)
);

INSERT INTO roles (code, name, description)
VALUES
    ('ADMIN', 'Administrador', 'Acceso administrativo a todos los módulos disponibles.'),
    ('USER', 'Usuario', 'Acceso operativo según el plan de suscripción de la cuenta.')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE auth_credentials
    ADD COLUMN role_code VARCHAR(32) NOT NULL DEFAULT 'USER',
    ADD CONSTRAINT auth_credentials_role_fk
        FOREIGN KEY (role_code) REFERENCES roles(code);

INSERT INTO menu_options (code, label, path, icon, sort_order)
VALUES
    ('dashboard', 'Dashboard', '/', 'LayoutDashboard', 10),
    ('audiencias', 'Audiencias', '/audiencias', 'Users', 20),
    ('activos', 'Activos', '/activos', 'Package', 30),
    ('oportunidades', 'Oportunidades', '/oportunidades', 'GitBranch', 40),
    ('acuerdos', 'Acuerdos', '/acuerdos', 'Handshake', 50),
    ('compromisos', 'Compromisos', '/compromisos', 'ClipboardCheck', 60),
    ('evidencias', 'Evidencias', '/evidencias', 'Images', 70),
    ('reportes', 'Reportes', '/reportes', 'FileBarChart', 80)
ON CONFLICT (code) DO NOTHING;

INSERT INTO subscription_menu_access (subscription_type, menu_option_code, role_code)
SELECT subscription_type, menu_option_code, 'USER'
FROM (VALUES
    ('FREE', 'dashboard'),
    ('FREE', 'activos'),
    ('FREE', 'oportunidades'),
    ('PRO', 'dashboard'),
    ('PRO', 'audiencias'),
    ('PRO', 'activos'),
    ('PRO', 'oportunidades'),
    ('PRO', 'acuerdos'),
    ('PRO', 'compromisos'),
    ('PRO', 'evidencias'),
    ('PRO', 'reportes'),
    ('ENTERPRISE', 'dashboard'),
    ('ENTERPRISE', 'audiencias'),
    ('ENTERPRISE', 'activos'),
    ('ENTERPRISE', 'oportunidades'),
    ('ENTERPRISE', 'acuerdos'),
    ('ENTERPRISE', 'compromisos'),
    ('ENTERPRISE', 'evidencias'),
    ('ENTERPRISE', 'reportes')
) AS access(subscription_type, menu_option_code)
ON CONFLICT DO NOTHING;

INSERT INTO subscription_menu_access (subscription_type, menu_option_code, role_code)
SELECT subscription_type, menu_option_code, 'ADMIN'
FROM (VALUES
    ('FREE', 'dashboard'), ('FREE', 'audiencias'), ('FREE', 'activos'), ('FREE', 'oportunidades'), ('FREE', 'acuerdos'), ('FREE', 'compromisos'), ('FREE', 'evidencias'), ('FREE', 'reportes'),
    ('PRO', 'dashboard'), ('PRO', 'audiencias'), ('PRO', 'activos'), ('PRO', 'oportunidades'), ('PRO', 'acuerdos'), ('PRO', 'compromisos'), ('PRO', 'evidencias'), ('PRO', 'reportes'),
    ('ENTERPRISE', 'dashboard'), ('ENTERPRISE', 'audiencias'), ('ENTERPRISE', 'activos'), ('ENTERPRISE', 'oportunidades'), ('ENTERPRISE', 'acuerdos'), ('ENTERPRISE', 'compromisos'), ('ENTERPRISE', 'evidencias'), ('ENTERPRISE', 'reportes')
) AS access(subscription_type, menu_option_code)
ON CONFLICT DO NOTHING;

CREATE INDEX subscription_menu_access_lookup_idx
    ON subscription_menu_access (subscription_type, role_code);

COMMIT;