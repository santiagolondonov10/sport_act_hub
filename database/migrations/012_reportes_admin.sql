BEGIN;

INSERT INTO menu_options (code, label, path, icon, sort_order)
VALUES ('reportes_admin', 'Reportes Admin', '/reportes-admin', 'ShieldCheck', 100)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, path = EXCLUDED.path, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO subscription_menu_access (subscription_type, menu_option_code)
VALUES ('ADMIN', 'reportes_admin')
ON CONFLICT DO NOTHING;

COMMIT;