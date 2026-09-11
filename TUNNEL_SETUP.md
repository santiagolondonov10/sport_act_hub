# Configuración para Acceso via Túnel (DevTunnels)

## Problema
Cuando accedes a la aplicación a través de un túnel de desarrollo (ej: `https://w3fszsbv-5173.use2.devtunnels.ms/`), el frontend no puede conectar al backend en `localhost:3001` porque localhost no es accesible desde el túnel remoto.

## Solución
Construir el frontend y servirlo junto con el backend desde el mismo puerto.

## Pasos para configurar

### Opción 1: Script de inicio automático (Recomendado)

#### En Windows:
```bash
start-with-tunnel.bat
```

Esto:
1. ✅ Construye el frontend (`npm run build`)
2. ✅ Copia los archivos a `dist/`
3. ✅ Inicia el backend en puerto 3001
4. ✅ El backend sirve tanto API como frontend

Luego accede a través del túnel:
- **Frontend**: https://w3fszsbv-5173.use2.devtunnels.ms/
- **Backend**: Mismo túnel (automáticamente en `/api`)

#### En macOS/Linux:
```bash
bash start-with-tunnel.sh
```

### Opción 2: Pasos manuales

1. **Construir el frontend:**
   ```bash
   npm run build
   ```
   Esto crea/actualiza la carpeta `dist/` con los archivos compilados.

2. **Asegurar que el backend está corriendo:**
   ```bash
   cd server
   npm start
   ```
   El backend ahora servirá:
   - ✅ Frontend en `http://localhost:3001/`
   - ✅ API en `http://localhost:3001/api/...`

3. **Acceder via túnel:**
   - Asegúrate que el túnel expone el puerto 3001
   - Accede a: `https://w3fszsbv-5173.use2.devtunnels.ms/`

## Configuración del túnel

Si estás usando `devtunnels`, asegúrate que:

1. El túnel está apuntando al puerto `3001` (donde corre el backend)
2. La URL base del túnel está configurada como:
   ```
   https://w3fszsbv-5173.use2.devtunnels.ms:3001
   ```
   O simplemente:
   ```
   https://w3fszsbv-5173.use2.devtunnels.ms
   ```

## Desarrollo local (sin túnel)

Para desarrollo local, puedes usar el dev server de Vite con el proxy:

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend (dev server)
npm run dev
```

Accede a: `http://localhost:5173`

El proxy de Vite redireccionará `/api/*` a `localhost:3001`.

## Solución de problemas

### "Failed to fetch" al hacer login desde el túnel
- ✅ Verifica que el backend esté corriendo en puerto 3001
- ✅ Verifica que el túnel expone el puerto 3001
- ✅ Reconstruye el frontend: `npm run build`
- ✅ Reinicia el backend: `cd server && npm start`

### El frontend muestra "not found" en el túnel
- Asegúrate que corriste `npm run build` antes de iniciar el backend
- Verifica que la carpeta `dist/` existe y tiene archivos
- Reinicia el backend después de construir

### CORS errors
- El backend está configurado con `Access-Control-Allow-Origin: *`
- Si aún tienes problemas, verifica los headers de la solicitud en DevTools

## Variables de entorno

### .env (desarrollo local)
```
DATABASE_URL=postgresql://postgres:Medellin123@localhost:5432/sports_act_hub
API_PORT=3001
VITE_API_URL=
```

### .env.tunnel (para referencia, si necesitas URL explícita)
```
VITE_API_URL=
VITE_PUBLIC_APP_URL=https://w3fszsbv-5173.use2.devtunnels.ms
```

Con `VITE_API_URL=` (vacío), las solicitudes usan rutas relativas `/api/*`.
