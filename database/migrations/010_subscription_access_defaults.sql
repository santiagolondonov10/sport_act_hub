BEGIN;

DELETE FROM subscription_menu_access;

INSERT INTO subscription_menu_access (subscription_type, menu_option_code)
VALUES
    ('FREE', 'dashboard'),
    ('FREE', 'activos'),
    ('FREE', 'oportunidades');

INSERT INTO subscription_menu_access (subscription_type, menu_option_code)
SELECT subscriptions.code, menu_options.code
FROM subscriptions
CROSS JOIN menu_options
WHERE subscriptions.code IN ('PRO', 'ENTERPRISE', 'ADMIN')
  AND menu_options.is_active = TRUE;

COMMIT;
