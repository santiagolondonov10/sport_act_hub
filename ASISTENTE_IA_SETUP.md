# Configuración del Asistente IA

## Resumen

Se ha implementado un asistente de IA con interfaz flotante que permite hacer preguntas sobre los datos de la base de datos. El asistente utiliza OpenAI GPT para generar respuestas inteligentes basadas en los datos de tu sistema.

## Estructura creada

```
src/features/asistente/
├── components/
│   ├── FloatingAssistant.tsx      (Botón flotante)
│   └── AssistantChat.tsx          (Interfaz de chat)
├── hooks/
│   └── useAssistant.ts            (Lógica de comunicación)
└── index.ts                        (Exportaciones)
```

## Configuración

### 1. Frontend (.env.local)

Ubicación: `C:\Users\USER\Desktop\Sport Act Hub\.env.local`

Este archivo ya fue creado. Contiene:

```
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

**⚠️ NOTA:** Actualmente el frontend no utiliza la API key directamente. La API key se envía desde el backend para mayor seguridad.

### 2. Backend (.env)

Ubicación: `C:\Users\USER\Desktop\Sport Act Hub\server\.env`

Debes crear este archivo con tu API key de OpenAI:

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
API_PORT=3001
```

**AQUÍ ES DONDE DEBES PEGAR TU API KEY DE OPENAI**

Ejemplo:
```
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl
API_PORT=3001
```

### 3. Cómo obtener tu API Key de OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Haz clic en "Create new secret key"
3. Copia la clave (comienza con `sk-`)
4. Pégala en el archivo `.env` del servidor como se mostró arriba

## Cómo usar

1. **Inicia el servidor backend:**
   ```bash
   npm run dev:server
   ```

2. **Inicia el frontend:**
   ```bash
   npm run dev
   ```

3. **Abre la aplicación** en el navegador (http://localhost:5173)

4. **Busca el botón flotante** azul en la esquina inferior derecha con el icono de mensaje

5. **Haz preguntas** sobre:
   - Marcas y patrocinadores
   - Acuerdos y patrocinios
   - Compromisos y entregas
   - Oportunidades comerciales
   - Evidencias y reportes

Ejemplos de preguntas:
- "¿Cuántos acuerdos tenemos vigentes?"
- "¿Cuál es el valor total del pipeline?"
- "¿Qué compromisos están pendientes?"
- "¿Cuál es el progreso de cumplimiento?"
- "¿Quiénes son nuestros patrocinadores principales?"

## Cómo funciona

1. El usuario hace una pregunta en la interfaz flotante
2. La pregunta se envía al backend (`POST /api/asistente/pregunta`)
3. El backend:
   - Obtiene datos relevantes de la base de datos
   - Construye un contexto con esa información
   - Envía la pregunta + contexto a OpenAI GPT
   - Recibe la respuesta generada por IA
   - La retorna al frontend
4. El frontend muestra la respuesta en el chat

## Seguridad

- ✅ La API key de OpenAI se almacena **solo en el servidor** (.env)
- ✅ El frontend NO tiene acceso a la clave
- ✅ Las preguntas se procesan con autenticación (requiere x-user-id)
- ✅ Se filtra información por compañía (companiaId)
- ✅ Se limita cantidad de resultados para evitar sobrecarga

## Troubleshooting

### "Configuración de OpenAI no disponible"
- Verifica que el archivo `.env` existe en la carpeta `server/`
- Verifica que `OPENAI_API_KEY` está correctamente configurado
- Reinicia el servidor

### "Error al procesar la pregunta con IA"
- Verifica que tu API key de OpenAI es válida
- Verifica que tienes suficiente crédito en tu cuenta de OpenAI
- Revisa la consola del servidor para más detalles

### El chat no envía mensajes
- Verifica que estés autenticado en la aplicación
- Revisa la consola del navegador para errores
- Verifica que el servidor está corriendo

## Próximas mejoras

- [ ] Cacheo de respuestas frecuentes
- [ ] Historial de conversaciones
- [ ] Sugerencias de preguntas
- [ ] Análisis más avanzados con múltiples queries
- [ ] Generación de reportes automáticos
- [ ] Soporte para diferentes modelos de OpenAI

## Notas técnicas

- **Modelo:** gpt-3.5-turbo (puedes cambiar a gpt-4 en el código)
- **Tokens máximos:** 500 por respuesta
- **Temperatura:** 0.7 (balance entre creatividad y precisión)
- **Límite de datos:** 20 registros por tabla para contexto

Para ajustar estos parámetros, edita el archivo `server/src/index.ts` en la sección del endpoint `/api/asistente/pregunta`.
