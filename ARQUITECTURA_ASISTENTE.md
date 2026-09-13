# 🏗️ Arquitectura del Asistente de IA

## Diagrama General

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APLICACIÓN WEB                                │
│                      http://localhost:5173                              │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │   FloatingAssistant (Botón)   │
                    │      + AssistantChat          │
                    └───────────────────┬───────────┘
                                        ↓
                        Usuario escribe pregunta
                                        ↓
                    ┌───────────────────────────────┐
                    │  useAssistant Hook            │
                    │  (Lógica del Chat)            │
                    └───────────────────┬───────────┘
                                        ↓
                        POST /api/asistente/pregunta
                                        ↓
┌────────────────────────────────────────────────────────────────────────┐
│                     SERVIDOR BACKEND                                   │
│                   http://localhost:3001                                 │
├────────────────────────────────────────────────────────────────────────┤
│  POST /api/asistente/pregunta                                          │
│  ├─ Recibe: { pregunta: "..." }                                        │
│  ├─ Autenticación: x-user-id header                                    │
│  ├─ Validación: companiaId                                             │
│  └─ Procesa...                                                         │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │   BASE DE DATOS               │
                    │   (PostgreSQL)                │
                    ├───────────────────────────────┤
                    │ - SELECT * FROM marcas        │
                    │ - SELECT * FROM acuerdos      │
                    │ - SELECT * FROM compromisos   │
                    │ - SELECT * FROM oportunidades │
                    └───────────────────┬───────────┘
                                        ↓
                    Datos obtenidos + Pregunta
                                        ↓
┌────────────────────────────────────────────────────────────────────────┐
│                        OPENAI API (Cloud)                              │
│                 https://api.openai.com/v1/chat/completions            │
├────────────────────────────────────────────────────────────────────────┤
│  POST request con:                                                     │
│  ├─ Authorization: Bearer OPENAI_API_KEY                               │
│  ├─ Model: gpt-3.5-turbo                                               │
│  ├─ Messages: [                                                        │
│  │   {role: "system", content: "Contexto de la BD..."},               │
│  │   {role: "user", content: "¿Cuántos acuerdos...?"}                 │
│  │ ]                                                                   │
│  └─ Max tokens: 500                                                    │
│                                                                        │
│  Response: "Tienes 12 acuerdos activos..."                             │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    Respuesta de OpenAI
                                    ↓
                    ┌───────────────────────────────┐
                    │  Backend procesa respuesta    │
                    │  Retorna al Frontend          │
                    └───────────────────┬───────────┘
                                        ↓
                    { respuesta: "Tienes 12..." }
                                        ↓
                    ┌───────────────────────────────┐
                    │  Frontend muestra en Chat     │
                    │  Mensaje del Asistente        │
                    └───────────────────────────────┘
                                        ↓
                        Usuario ve respuesta ✅
```

---

## Estructura de Componentes

```
Frontend (React + TypeScript)
│
├── src/features/asistente/
│   │
│   ├── components/
│   │   ├── FloatingAssistant.tsx
│   │   │   └─ Botón flotante en esquina
│   │   │      Estados: normal, cargando, abierto
│   │   │      Icono: MessageCircle (cerrado), X (abierto)
│   │   │
│   │   └── AssistantChat.tsx
│   │       └─ Ventana modal de chat
│   │          - Header con título
│   │          - Área de mensajes (scrollable)
│   │          - Input para preguntas
│   │          - Botón de envío
│   │          - Estados de carga y error
│   │
│   ├── hooks/
│   │   └── useAssistant.ts
│   │       └─ Lógica de comunicación
│   │          - enviarPregunta(): Promise<string>
│   │          - cargando: boolean
│   │          - error: string | null
│   │
│   └── index.ts
│       └─ Exporta componentes y hooks
│
└── App.tsx (Integración)
    └─ <FloatingAssistant /> renderizado al final
```

---

## Estructura del Backend

```
server/src/index.ts
│
├── Endpoint existente
│
├── Endpoint nuevo: POST /api/asistente/pregunta
│   │
│   ├─ Validación:
│   │  ├─ x-user-id header ✓
│   │  ├─ companiaId válido ✓
│   │  └─ pregunta no vacía ✓
│   │
│   ├─ Obtención de datos:
│   │  ├─ pool.query("SELECT * FROM marcas") → 20 registros
│   │  ├─ pool.query("SELECT * FROM acuerdos") → 20 registros
│   │  ├─ pool.query("SELECT * FROM compromisos") → 20 registros
│   │  └─ pool.query("SELECT * FROM oportunidades") → 20 registros
│   │
│   ├─ Construcción de contexto:
│   │  └─ Texto con datos formateados para GPT
│   │
│   ├─ Llamada a OpenAI:
│   │  ├─ fetch("https://api.openai.com/v1/chat/completions")
│   │  ├─ headers: { Authorization: "Bearer OPENAI_API_KEY" }
│   │  ├─ body: { model, messages, max_tokens, temperature }
│   │  └─ response.json() → extrae contenido
│   │
│   └─ Respuesta:
│      └─ { respuesta: "..." }
│
└── server/.env (Configuración)
    └─ OPENAI_API_KEY=sk-proj-...
       API_PORT=3001
```

---

## Flujo de Datos Detallado

### 1. Usuario interactúa

```javascript
Usuario → FloatingAssistant (clic)
        ↓
    Abre: <AssistantChat>
        ↓
    Usuario escribe en input
        ↓
    Usuario presiona Enter o clic en envío
        ↓
    handleEnviar() ejecuta
```

### 2. Frontend envía pregunta

```javascript
const respuesta = await enviarPregunta("¿Cuántos acuerdos?");
                  ↓
    fetch("/api/asistente/pregunta", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: "..." })
    })
```

### 3. Backend procesa

```javascript
POST /api/asistente/pregunta
  ├─ Lee body.pregunta ✓
  ├─ Obtiene companiaId de x-user-id ✓
  ├─ Ejecuta 4 queries a BD ✓
  ├─ Construye contexto para OpenAI ✓
  └─ Llama a OpenAI API ✓
```

### 4. OpenAI genera respuesta

```
Contexto + Pregunta → GPT-3.5-turbo → Análisis → Respuesta
```

### 5. Backend retorna

```javascript
sendJson(response, 200, {
  respuesta: "Tienes 12 acuerdos activos..."
})
```

### 6. Frontend muestra

```javascript
setMensajes(prev => [...prev, {
  role: "assistant",
  content: respuesta,
  ...
}])
```

---

## Seguridad

```
┌─────────────────────────────────────────────────────────┐
│              NIVELES DE PROTECCIÓN                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. API Key Segura                                       │
│    └─ Almacenada: server/.env (nunca en público)       │
│    └─ No se envía: Al navegador                        │
│    └─ Solo usa: El servidor                            │
│                                                          │
│ 2. Autenticación                                        │
│    └─ Requerida: x-user-id en header                   │
│    └─ Valida: Compañía del usuario                     │
│    └─ Filtra: Datos por companiaId                     │
│                                                          │
│ 3. Comunicación Segura                                  │
│    └─ Frontend ← HTTPS → Backend (local en desarrollo) │
│    └─ Backend ← HTTPS → OpenAI (api.openai.com)        │
│                                                          │
│ 4. Datos Limitados                                      │
│    └─ Máximo 20 registros por tabla en contexto        │
│    └─ Solo columnas necesarias                         │
│    └─ Filtra por companiaId                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Configuración de Variables

```
┌─────────────────────────────────────────────────────────┐
│              VARIABLES DE AMBIENTE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Frontend (.env.local)                                   │
│ ├─ VITE_OPENAI_API_KEY=... (no se usa actualmente)     │
│ └─ Preparado para futuras extensiones                  │
│                                                          │
│ Backend (server/.env)                                   │
│ ├─ OPENAI_API_KEY=sk-proj-... (REQUERIDO ⚡)           │
│ └─ API_PORT=3001 (opcional, default 3001)              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Modelos de Respuesta

### Request al Backend

```json
POST /api/asistente/pregunta
Content-Type: application/json
x-user-id: user-123
x-api-key: abc123

{
  "pregunta": "¿Cuántos acuerdos tenemos?"
}
```

### Response del Backend

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "respuesta": "Tienes 12 acuerdos vigentes en el sistema. De estos, 8 están activos y 4 próximos a vencer en los próximos 30 días. El valor total es de $45.000.000 COP."
}
```

### Error Response

```json
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Configuración de OpenAI no disponible."
}
```

---

## Parámetros Ajustables

| Parámetro | Ubicación | Valor Actual | Rango |
|-----------|-----------|-------------|-------|
| Modelo | server/src/index.ts:2766 | `gpt-3.5-turbo` | gpt-3.5-turbo, gpt-4, etc |
| Max Tokens | server/src/index.ts:2770 | 500 | 1-4096 |
| Temperature | server/src/index.ts:2771 | 0.7 | 0-1 (0=preciso, 1=creativo) |
| Límite de Registros | server/src/index.ts:2742-2745 | 20 | 1-1000 |

---

## Rendimiento

```
┌─────────────────────────────────────────────────────────┐
│              MÉTRICAS DE VELOCIDAD                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Consulta a BD:               ~100ms                     │
│ Construcción de contexto:    ~10ms                      │
│ Llamada a OpenAI:            ~2-5s                      │
│ Procesamiento de respuesta:  ~50ms                      │
│                                                          │
│ TOTAL (promedio):            ~2.5-5.2 segundos         │
│                                                          │
│ Factores que afectan velocidad:                         │
│ ├─ Carga de OpenAI                                      │
│ ├─ Tamaño de la pregunta                                │
│ ├─ Cantidad de datos en contexto                        │
│ └─ Conexión a internet                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Escalabilidad Futura

```
Mejoras posibles:

1. Caché de Respuestas
   └─ Redis para preguntas frecuentes

2. Búsqueda Semántica
   └─ Embeddings para mejor contexto

3. Múltiples Modelos
   └─ Elegir entre gpt-3.5 y gpt-4

4. Análisis Avanzado
   └─ Multiple queries + aggregaciones

5. Generación de Reportes
   └─ Crear PDFs automáticos

6. Análisis Predictivo
   └─ Forecasting de oportunidades

7. Integración con Dashboards
   └─ Sugerencias automáticas
```

---

**Diagrama actualizado:** 2026-09-12
