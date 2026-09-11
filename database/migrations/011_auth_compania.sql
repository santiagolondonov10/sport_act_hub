BEGIN;

ALTER TABLE auth_credentials
    ADD COLUMN compania_id UUID REFERENCES companias(id) ON DELETE SET NULL;

CREATE INDEX auth_credentials_compania_idx ON auth_credentials (compania_id);

COMMENT ON COLUMN auth_credentials.compania_id IS 'Compañía asignada por un administrador; nunca se recibe desde el registro público.';

COMMIT;