# Implementación Multi-Tenant con compania_id

## Status
✅ Migración de base de datos creada: `014_multi_tenant_compania_id.sql`
✅ Backend actualizado para incluir `companiaId` en respuesta de login
⏳ Pendiente: Aplicar migración a BD + Actualizar todas las queries

## Cambios Completados

### 1. Base de Datos
- **Archivo**: `database/migrations/014_multi_tenant_compania_id.sql`
- Agrega `compania_id` a todas las tablas transaccionales:
  - activos
  - oportunidades
  - acuerdos
  - compromisos
  - campanas_audiencia
  - evidencias
  - reportes
  - actividades_oportunidad

### 2. Backend - Login
- **Archivo**: `server/src/index.ts` (línea 101)
- Ahora retorna `companiaId` junto a datos del usuario
- El cliente almacenará esto en sesión/localStorage

## Cambios Pendientes Urgentes

### A. Ejecutar Migración en Base de Datos
```bash
cd server
node scripts/run-migration.js
```
O usando psql:
```bash
psql -h localhost -U postgres -d sports_act_hub -f database/migrations/014_multi_tenant_compania_id.sql
```

### B. Actualizar Frontend - Almacenar companiaId
**Archivo**: `src/lib/auth.ts`
```typescript
// Agregar companiaId a sesión
export function getSessionCompaniaId(): string | null {
  try {
    const session = JSON.parse(sessionStorage.getItem('session') || '{}');
    return session.user?.companiaId || null;
  } catch {
    return null;
  }
}
```

### C. Actualizar ALL Queries en Backend

#### Plantilla para queries seguras:
```typescript
// ❌ INSEGURO - SIN FILTRO DE compania_id
const result = await pool.query(`
  SELECT * FROM acuerdos WHERE id = $1
`, [acuerdoId]);

// ✅ SEGURO - CON FILTRO DE compania_id
function getUserCompaniaId(userId: string) {
  const result = await pool.query(
    `SELECT compania_id FROM auth_credentials WHERE id = $1`,
    [userId]
  );
  return result.rows[0]?.compania_id;
}

const companiaId = getUserCompaniaId(userId);
const result = await pool.query(`
  SELECT * FROM acuerdos 
  WHERE id = $1 AND compania_id = $2
`, [acuerdoId, companiaId]);
```

#### Queries a actualizar (Lista Completa):

**API Endpoints (server/src/index.ts)**:
- `GET /api/activos` → Agregar `WHERE compania_id = $1`
- `POST /api/activos` → Agregar `compania_id` al INSERT
- `GET /api/oportunidades` → Agregar `WHERE compania_id = $1`
- `POST /api/oportunidades` → Agregar `compania_id` al INSERT
- `GET /api/acuerdos` → Agregar `WHERE compania_id = $1`
- `POST /api/acuerdos` → Agregar `compania_id` al INSERT
- `GET /api/compromisos` → Agregar `WHERE compania_id = $1`
- `POST /api/compromisos` → Agregar `compania_id` al INSERT
- `GET /api/evidencias` → Agregar `WHERE compania_id = $1`
- `POST /api/evidencias` → Agregar `compania_id` al INSERT
- `GET /api/reportes` → Agregar `WHERE compania_id = $1`
- `GET /api/campanas` → Agregar `WHERE compania_id = $1`

### D. Patrones de Implementación

#### 1. En Selects
```sql
SELECT * FROM acuerdos 
WHERE compania_id = $1 AND [other conditions]
```

#### 2. En Inserts
```sql
INSERT INTO acuerdos (nombre, compania_id, ...) 
VALUES ($1, $2, ...)
```

#### 3. En Updates
```sql
UPDATE acuerdos 
SET campo = $1 
WHERE id = $2 AND compania_id = $3
```

#### 4. En Deletes
```sql
DELETE FROM acuerdos 
WHERE id = $1 AND compania_id = $2
```

### E. Validación de Seguridad

Cada endpoint debe:
1. Obtener `companiaId` del usuario autenticado
2. Validar que la operación sea sobre datos de su `companiaId`
3. Rechazar (403 Forbidden) si intenta acceder a datos de otro `companiaId`

```typescript
async function getUserCompaniaId(userId: string): string {
  const result = await pool.query(
    `SELECT compania_id FROM auth_credentials WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]?.compania_id) {
    throw new Error('Usuario sin compañía asignada');
  }
  return result.rows[0].compania_id;
}

// En cada endpoint:
const userId = request.headers['x-user-id'];
const companiaId = await getUserCompaniaId(userId);
// Usar companiaId en todas las queries
```

## Checklist de Implementación

- [ ] Ejecutar migración 014 en BD
- [ ] Verificar que `compania_id` se agregó a todas las tablas
- [ ] Actualizar `src/lib/auth.ts` para almacenar `companiaId`
- [ ] Actualizar cada endpoint GET para filtrar por `compania_id`
- [ ] Actualizar cada endpoint POST para incluir `compania_id`
- [ ] Actualizar cada endpoint PUT/PATCH para validar `compania_id`
- [ ] Actualizar cada endpoint DELETE para validar `compania_id`
- [ ] Crear función `getUserCompaniaId()` reutilizable
- [ ] Verificar que NO se devuelven datos de otras compañías
- [ ] Probar con 2+ usuarios de diferentes compañías
- [ ] Compilar y verificar (npm run build)

## Tablas de Referencia (Shared, NO necesitan compania_id)
- `auth_credentials` (pero tiene compania_id)
- `companias` (compañías mismas)
- `responsables` (pueden ser compartidos)
- `marcas` (pueden ser compartidos, aunque debería revisarse)
- `segmentos_audiencia` (datos de sistema)
- `canales_audiencia` (datos de sistema)
- `capacidades_activacion` (datos de sistema)

## Notas de Seguridad Crítica
⚠️ **NUNCA** devolver datos sin validar `compania_id`
⚠️ **SIEMPRE** incluir `compania_id` en WHERE clause
⚠️ **SIEMPRE** validar que el usuario pertenece a la compañía antes de operar
⚠️ **NUNCA** permitir que un usuario vea datos de otra compañía

## Próximos Pasos
1. Aplicar migración a BD de desarrollo
2. Implementar helper function `getUserCompaniaId()`
3. Actualizar todos los endpoints sistemáticamente
4. Crear tests para validar aislamiento de datos
