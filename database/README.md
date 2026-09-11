# Base de datos local

La base de desarrollo usa PostgreSQL local con el nombre `sports_act_hub`.

## Aplicar la migración inicial

Desde una sesión autenticada de `psql` conectada a `sports_act_hub`:

```sql
\i 'C:/Users/USER/Desktop/Sport Act Hub/database/migrations/001_initial_schema.sql'
```

Validar las tablas:

```sql
\dt
```

La aplicación backend usa `DATABASE_URL`. Copia `.env.example` a `.env` y reemplaza `CHANGE_ME` por la contraseña local de PostgreSQL.