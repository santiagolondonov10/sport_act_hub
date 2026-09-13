# 📄 Archivo `.env` del Servidor

## Ubicación Exacta

```
C:\Users\USER\Desktop\Sport Act Hub\server\.env
```

## Contenido Exacto

Copia y pega esto en el archivo `.env`:

```env
OPENAI_API_KEY=sk-proj-tu-clave-aqui
API_PORT=3001
```

## Cómo Debería Verse

### ✅ CORRECTO

```env
OPENAI_API_KEY=sk-proj-abc123def456ghi789jklmnopqrstu
API_PORT=3001
```

### ❌ INCORRECTO (Errores comunes)

```env
# ❌ Con comillas
OPENAI_API_KEY="sk-proj-abc123def456ghi789jklmnopqrstu"

# ❌ Con espacios
OPENAI_API_KEY = sk-proj-abc123def456ghi789jklmnopqrstu

# ❌ Clave incompleta
OPENAI_API_KEY=sk-proj-abc123

# ❌ Sin la clave
OPENAI_API_KEY=
API_PORT=3001

# ❌ Formato incorrecto
openai_api_key=sk-proj-abc123def456ghi789jklmnopqrstu
api_port=3001
```

## Cómo Crear el Archivo

### Método 1: Usar PowerShell (Recomendado)

```powershell
cd "C:\Users\USER\Desktop\Sport Act Hub\server"
@'
OPENAI_API_KEY=sk-proj-tu-clave-aqui
API_PORT=3001
'@ | Out-File -Encoding utf8 .env
```

### Método 2: Usar CMD

```cmd
cd C:\Users\USER\Desktop\Sport Act Hub\server
(
  echo OPENAI_API_KEY=sk-proj-tu-clave-aqui
  echo API_PORT=3001
) > .env
```

### Método 3: VSCode

1. Abre VSCode
2. Abre carpeta: `C:\Users\USER\Desktop\Sport Act Hub`
3. Haz clic derecho en carpeta `server`
4. Selecciona "New File"
5. Escribe `.env`
6. Pega el contenido:
```
OPENAI_API_KEY=sk-proj-tu-clave-aqui
API_PORT=3001
```
7. Ctrl+S para guardar

### Método 4: Block de Notas

1. Abre Block de Notas
2. Pega:
```
OPENAI_API_KEY=sk-proj-tu-clave-aqui
API_PORT=3001
```
3. Click en "Guardar Como"
4. Navega a: `C:\Users\USER\Desktop\Sport Act Hub\server\`
5. Nombre: `.env`
6. Tipo: "Todos los archivos (*.*)"
7. Guardar

## Cómo Reemplazar la Clave

### Ejemplo 1: Si tu clave es `sk-proj-3f5c8b9a2d1e4g6h`

```env
OPENAI_API_KEY=sk-proj-3f5c8b9a2d1e4g6h
API_PORT=3001
```

### Ejemplo 2: Si tu clave es `sk-proj-real12345abcdef`

```env
OPENAI_API_KEY=sk-proj-real12345abcdef
API_PORT=3001
```

## Verificar que Está Correcto

### En PowerShell

```powershell
cd "C:\Users\USER\Desktop\Sport Act Hub\server"
cat .env
```

Deberías ver:
```
OPENAI_API_KEY=sk-proj-...
API_PORT=3001
```

### En CMD

```cmd
cd C:\Users\USER\Desktop\Sport Act Hub\server
type .env
```

### En VSCode

1. Abre la carpeta server
2. Deberías ver el archivo `.env` en la lista de archivos
3. Haz clic para ver su contenido

## Cosas Importantes

| ✅ Hazlo | ❌ No lo hagas |
|---------|--------------|
| Guarda como `.env` | Guardes como `.env.txt` |
| Usa tu clave real | Dejes `tu-clave-aqui` |
| Comienza con `sk-` | Uses una clave diferente |
| Una línea por variable | Mezcles con otros textos |
| Codificación UTF-8 | ANSI o ASCII |

## Después de Crear

1. Guarda el archivo
2. Abre Terminal/PowerShell en la carpeta raíz
3. Ejecuta: `npm run dev:server`
4. Deberías ver: `Sports Act Hub API listening on http://localhost:3001`

Si ves un error sobre OpenAI:
- Verifica que el archivo `.env` existe
- Verifica que contiene `OPENAI_API_KEY=sk-...`
- Reinicia el servidor

## Dónde Obtener la Clave

1. Ve a https://platform.openai.com/api-keys
2. Haz login en tu cuenta
3. Click en "Create new secret key"
4. Se mostrará algo como:
   ```
   sk-proj-abc123def456ghi789jklmnopqrstu
   ```
5. Cópiala (ojo: aparece una sola vez)
6. Pégala en el archivo `.env`

## Preguntas

**P: ¿Qué es `sk-proj-`?**
R: Es el prefijo de OpenAI que indica que es una clave válida.

**P: ¿Puedo compartir mi `.env`?**
R: ❌ NO. Nunca compartas tu clave. Es como una contraseña.

**P: ¿Qué es `API_PORT=3001`?**
R: Es el puerto donde escucha el servidor. Déjalo en 3001.

**P: ¿Qué pasa si la clave es incorrecta?**
R: Recibirás error "Authentication failed" de OpenAI.

---

**¡Una vez hagas esto, el asistente estará 100% funcional! 🚀**
