# 🤖 Asistente de IA - Instrucciones Completas

## ¿Qué se ha creado?

Se implementó un **asistente de inteligencia artificial** flotante que permite consultar la base de datos usando lenguaje natural. Puedes hacer preguntas en español y el asistente te responderá con información de tu sistema.

---

## 📋 Archivos Creados

### Frontend
```
src/features/asistente/
├── components/
│   ├── FloatingAssistant.tsx       ← Botón flotante azul
│   └── AssistantChat.tsx           ← Ventana de chat
├── hooks/
│   └── useAssistant.ts             ← Lógica de comunicación
└── index.ts                        ← Exportaciones
```

### Backend
- Endpoint: `POST /api/asistente/pregunta`
- Ubicación: `server/src/index.ts`

### Configuración
- Frontend: `.env.local` (ya creado)
- Backend: `server/.env` (debes crear)
- Ejemplos: `server/.env.example`

---

## 🔑 PASO 1: Obtén tu API Key de OpenAI

### Opción A: Cuenta Existente
1. Ve a https://platform.openai.com/api-keys
2. Inicia sesión con tu cuenta
3. Click en "Create new secret key"
4. Copia la clave (comienza con `sk-proj-`)

### Opción B: Nueva Cuenta
1. Ve a https://platform.openai.com
2. Crea una cuenta
3. Agrega método de pago
4. Ve a API keys y crea una nueva

**⚠️ La clave se ve una sola vez. Guárdala en un lugar seguro.**

---

## ⚙️ PASO 2: Configura el Backend

### Crear archivo `.env` en el servidor

**Ubicación:** `C:\Users\USER\Desktop\Sport Act Hub\server\.env`

**Contenido:**
```
OPENAI_API_KEY=sk-proj-tu-clave-aqui-sin-comillas
API_PORT=3001
```

**Ejemplo real:**
```
OPENAI_API_KEY=sk-proj-abc123def456ghi789jklmnopqrstu
API_PORT=3001
```

### Verificar archivo
Si quieres verificar que lo creaste bien:
```bash
cat server/.env
```

---

## 🚀 PASO 3: Inicia los Servidores

### Terminal 1 - Backend
```bash
cd "C:\Users\USER\Desktop\Sport Act Hub"
npm run dev:server
```

Deberías ver:
```
Sports Act Hub API listening on http://localhost:3001
```

### Terminal 2 - Frontend
```bash
cd "C:\Users\USER\Desktop\Sport Act Hub"
npm run dev
```

Deberías ver:
```
VITE v... ready in ... ms
➜  Local:   http://localhost:5173/
```

---

## 💬 PASO 4: Usa el Asistente

1. Abre http://localhost:5173 en tu navegador
2. Inicia sesión en la aplicación
3. Busca el **botón azul con icono de mensaje** en la esquina inferior derecha
4. Haz una pregunta sobre tus datos
5. El asistente te responderá

---

## 📝 Ejemplos de Preguntas

### Sobre Acuerdos
- "¿Cuántos acuerdos tenemos vigentes?"
- "¿Cuál es el valor total de los acuerdos?"
- "¿Cuáles acuerdos vencen pronto?"
- "¿Cuál es el progreso de cumplimiento?"

### Sobre Marcas
- "¿Quiénes son nuestros patrocinadores principales?"
- "¿Cuántas marcas hay registradas?"
- "¿Cuál es el contacto de [marca]?"

### Sobre Compromisos
- "¿Cuántos compromisos están pendientes?"
- "¿Cuál es el progreso general de entregas?"
- "¿Qué compromisos vencen esta semana?"

### Sobre Oportunidades
- "¿Cuántas oportunidades tenemos en el pipeline?"
- "¿Cuál es el valor total del pipeline?"
- "¿En qué etapa estamos?"

---

## 🔒 Seguridad

✅ **Tu API Key está protegida:**
- Se almacena **solo en el servidor** (`server/.env`)
- **No se envía al navegador**
- No aparece en la interfaz
- No se guarda en historial

✅ **Las preguntas están autenticadas:**
- Solo usuarios logeados pueden hacer preguntas
- Cada usuario ve datos de su compañía
- Las preguntas se procesan de forma segura

---

## 🐛 Solución de Problemas

### Error: "Configuración de OpenAI no disponible"
**Causa:** El archivo `.env` del servidor no existe o está vacío

**Solución:**
1. Verifica que `server/.env` existe
2. Verifica que contiene `OPENAI_API_KEY=sk-...`
3. Reinicia el servidor con `npm run dev:server`

### Error: "Error al procesar la pregunta con IA"
**Causa:** Problema con la API key de OpenAI

**Solución:**
1. Verifica que tu API key es correcta (comienza con `sk-`)
2. Verifica que tienes crédito disponible en OpenAI
3. Revisa la consola del servidor para más detalles

### El chat no envía mensajes
**Causa:** No estás autenticado

**Solución:**
1. Inicia sesión en la aplicación
2. Recarga la página (F5)
3. Intenta nuevamente

### El botón flotante no aparece
**Causa:** JavaScript no se cargó completamente

**Solución:**
1. Recarga la página
2. Limpia el caché del navegador (Ctrl+Shift+Supr)
3. Reinicia el servidor frontend

---

## 📊 Cómo Funciona Internamente

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario hace pregunta en el chat flotante                │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend envía: POST /api/asistente/pregunta             │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend obtiene datos de la BD:                          │
│    - Marcas (patrocinadores)                                │
│    - Acuerdos                                               │
│    - Compromisos                                            │
│    - Oportunidades                                          │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend envía pregunta + contexto a OpenAI API           │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. OpenAI genera respuesta inteligente                      │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend retorna respuesta al frontend                    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Frontend muestra respuesta en el chat                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Parámetros de IA (Avanzado)

Si quieres ajustar cómo funciona la IA, edita `server/src/index.ts`:

```javascript
body: JSON.stringify({
  model: 'gpt-3.5-turbo',      // Puedes cambiar a 'gpt-4'
  messages,
  max_tokens: 500,             // Respuestas más largas/cortas
  temperature: 0.7,            // 0=preciso, 1=creativo
}),
```

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa la consola del servidor (terminal)
3. Verifica que el `.env` está correctamente configurado
4. Reinicia ambos servidores

---

## 🎯 Próximas Características Posibles

- [ ] Historial de conversaciones
- [ ] Sugerencias inteligentes
- [ ] Reportes automáticos generados por IA
- [ ] Análisis predictivos
- [ ] Exportación de respuestas

---

**¡Tu asistente está listo! 🚀**
