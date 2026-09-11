-- Add Marketplace to subscription access (make it available for all subscription types)

-- Add Marketplace to subscription_menu_access for all subscription types
INSERT INTO subscription_menu_access (subscription_type, menu_option_code)
VALUES
  ('ADMIN', 'marketplace'),
  ('PRO', 'marketplace'),
  ('ENTERPRISE', 'marketplace'),
  ('FREE', 'marketplace')
ON CONFLICT DO NOTHING;

-- Update subscriptions to include 'Marketplace' in features for PRO and ENTERPRISE plans
UPDATE subscriptions
SET features = features || '"Marketplace"'::jsonb
WHERE code IN ('PRO', 'ENTERPRISE')
  AND NOT (features @> '"Marketplace"'::jsonb);

-- Update FREE to include Marketplace
UPDATE subscriptions
SET features = features || '"Marketplace"'::jsonb
WHERE code = 'FREE'
  AND NOT (features @> '"Marketplace"'::jsonb);
