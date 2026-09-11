BEGIN;

CREATE TABLE subscription_menu_access_new (
    subscription_type VARCHAR(32) NOT NULL REFERENCES subscriptions(code) ON DELETE CASCADE,
    menu_option_code VARCHAR(64) NOT NULL REFERENCES menu_options(code) ON DELETE CASCADE,
    PRIMARY KEY (subscription_type, menu_option_code)
);

INSERT INTO subscription_menu_access_new (subscription_type, menu_option_code)
SELECT DISTINCT subscription_type, menu_option_code
FROM subscription_menu_access;

DROP TABLE subscription_menu_access;
ALTER TABLE subscription_menu_access_new RENAME TO subscription_menu_access;

ALTER TABLE auth_credentials DROP CONSTRAINT IF EXISTS auth_credentials_role_fk;
ALTER TABLE auth_credentials DROP COLUMN IF EXISTS role_code;
DROP TABLE IF EXISTS roles;

CREATE INDEX subscription_menu_access_lookup_idx ON subscription_menu_access (subscription_type);

COMMIT;
