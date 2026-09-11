-- Fix menu order to match the correct sequence

UPDATE menu_options SET sort_order = 0 WHERE code = 'marketplace';
UPDATE menu_options SET sort_order = 10 WHERE code = 'dashboard';
UPDATE menu_options SET sort_order = 20 WHERE code = 'audiencias';
UPDATE menu_options SET sort_order = 30 WHERE code = 'marcas';
UPDATE menu_options SET sort_order = 40 WHERE code = 'activos';
UPDATE menu_options SET sort_order = 50 WHERE code = 'oportunidades';
UPDATE menu_options SET sort_order = 60 WHERE code = 'acuerdos';
UPDATE menu_options SET sort_order = 70 WHERE code = 'compromisos';
UPDATE menu_options SET sort_order = 80 WHERE code = 'evidencias';
UPDATE menu_options SET sort_order = 90 WHERE code = 'reportes';
UPDATE menu_options SET sort_order = 100 WHERE code = 'reportes_admin';
UPDATE menu_options SET sort_order = 110 WHERE code = 'parametrizacion';
