-- Add Marcas menu option

INSERT INTO menu_options (code, label, path, icon, sort_order, is_active)
VALUES ('marcas', 'Marcas', '/marcas', 'Users', 15, TRUE)
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    path = EXCLUDED.path,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Add Marcas to all subscription types
INSERT INTO subscription_menu_access (subscription_type, menu_option_code)
VALUES
    ('ADMIN', 'marcas'),
    ('PRO', 'marcas'),
    ('ENTERPRISE', 'marcas'),
    ('FREE', 'marcas')
ON CONFLICT DO NOTHING;
