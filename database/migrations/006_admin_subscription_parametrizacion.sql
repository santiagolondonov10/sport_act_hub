BEGIN;

INSERT INTO subscriptions (code, name, description, price_cop, max_users, features)
VALUES (
    'ADMIN',
    'Administrador',
    'Acceso completo a la plataforma y a la parametrización del sistema.',
    0,
    NULL,
    '["Todos los módulos", "Parametrización", "Gestión de accesos"]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    updated_at = NOW();

INSERT INTO menu_options (code, label, path, icon, sort_order)
VALUES ('parametrizacion', 'Parametrización', '/parametrizacion', 'Settings2', 90)
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    path = EXCLUDED.path,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO subscription_menu_access (subscription_type, menu_option_code, role_code)
SELECT 'ADMIN', code, 'ADMIN'
FROM menu_options
ON CONFLICT DO NOTHING;

COMMIT;