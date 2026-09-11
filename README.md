# Sports Act Business Hub

Front-end de la plataforma SaaS B2B para la gestión comercial de patrocinios deportivos: activos, oportunidades, acuerdos, compromisos, evidencias, reportes y audiencias.

Esta es una versión **front-end con datos simulados** (mock, tipados y centralizados en `src/data/`). No incluye backend, base de datos ni autenticación real — ver `CLAUDE.md` para el alcance y las reglas de producto completas.

## Stack

- React 19 + TypeScript (tipado estricto)
- Vite 8
- Tailwind CSS v4
- React Router v7
- Lucide React (iconografía)
- Recharts (gráficos)
- @dnd-kit (drag & drop del pipeline de Oportunidades)

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

Otros comandos disponibles:

```bash
npm run build    # compila para producción (tsc -b && vite build)
npm run lint     # oxlint
npm run preview  # sirve el build de producción localmente
```

## Estructura del proyecto

```text
src/
  components/    # ui/, layout/, shared/ — componentes reutilizables
  features/      # un módulo por dominio (dashboard, activos, oportunidades,
                  # acuerdos, compromisos, evidencias, reportes, audiencias)
  data/          # datos mock centralizados y tipados
  types/         # tipos e interfaces de dominio
  lib/           # formato, estilos de estado, selectores derivados
  hooks/         # hooks compartidos (toast, click-outside, etc.)
  routes/        # configuración de rutas
```

## Módulos

Dashboard · Audiencias y alcance · Activos · Oportunidades · Acuerdos · Compromisos · Evidencias · Reportes

Consulta `CLAUDE.md` para el detalle de cada módulo, las relaciones de dominio y las reglas de producto.
