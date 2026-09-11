-- Add Marketplace menu option after Dashboard

-- Insert Marketplace menu option if it doesn't exist
INSERT INTO menu_options (code, label, path, icon, sort_order, is_active)
VALUES ('marketplace', 'Marketplace', '/marketplace', 'store', 1, TRUE)
ON CONFLICT DO NOTHING;

-- Update sort_order for existing menu options to accommodate Marketplace after Dashboard
-- Dashboard: 0 (unchanged)
-- Marketplace: 1 (new)
-- All others shift down by 1
UPDATE menu_options SET sort_order = sort_order + 1 WHERE code != 'marketplace' AND sort_order >= 1;
