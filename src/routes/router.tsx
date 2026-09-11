import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { AudienciasPage } from '@/features/audiencias/pages/AudienciasPage';
import { MarcasListPage } from '@/features/marcas/pages/MarcasListPage';
import { ActivosListPage } from '@/features/activos/pages/ActivosListPage';
import { ActivoDetallePage } from '@/features/activos/pages/ActivoDetallePage';
import { OportunidadesPage } from '@/features/oportunidades/pages/OportunidadesPage';
import { OportunidadDetallePage } from '@/features/oportunidades/pages/OportunidadDetallePage';
import { AcuerdosListPage } from '@/features/acuerdos/pages/AcuerdosListPage';
import { AcuerdoDetallePage } from '@/features/acuerdos/pages/AcuerdoDetallePage';
import { CompromisosPage } from '@/features/compromisos/pages/CompromisosPage';
import { EvidenciasPage } from '@/features/evidencias/pages/EvidenciasPage';
import { ReportesListPage } from '@/features/reportes/pages/ReportesListPage';
import { ReporteDetallePage } from '@/features/reportes/pages/ReporteDetallePage';
import { ReportesAdminPage } from '@/features/reportes-admin/pages/ReportesAdminPage';
import { NotFoundPage } from './NotFoundPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ParametrizacionPage } from '@/features/parametrizacion/pages/ParametrizacionPage';
import { SuscripcionesPage } from '@/features/parametrizacion/pages/SuscripcionesPage';
import { CompaniasPage } from '@/features/parametrizacion/pages/CompaniasPage';
import { SectoresPage } from '@/features/parametrizacion/pages/SectoresPage';
import { UsuariosPage } from '@/features/parametrizacion/pages/UsuariosPage';
import { CategoriasActivosPage } from '@/features/parametrizacion/pages/CategoriasActivosPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/audiencias', element: <AudienciasPage /> },
      { path: '/marcas', element: <MarcasListPage /> },
      { path: '/activos', element: <ActivosListPage /> },
      { path: '/activos/:activoId', element: <ActivoDetallePage /> },
      { path: '/oportunidades', element: <OportunidadesPage /> },
      { path: '/oportunidades/:oportunidadId', element: <OportunidadDetallePage /> },
      { path: '/marketplace', element: <MarketplacePage /> },
      { path: '/acuerdos', element: <AcuerdosListPage /> },
      { path: '/acuerdos/:acuerdoId', element: <AcuerdoDetallePage /> },
      { path: '/compromisos', element: <CompromisosPage /> },
      { path: '/evidencias', element: <EvidenciasPage /> },
      { path: '/reportes', element: <ReportesListPage /> },
      { path: '/reportes/:acuerdoId', element: <ReporteDetallePage /> },
      { path: '/reportes-admin', element: <ReportesAdminPage /> },
      { path: '/parametrizacion', element: <ParametrizacionPage /> },
      { path: '/parametrizacion/suscripciones', element: <SuscripcionesPage /> },
      { path: '/parametrizacion/companias', element: <CompaniasPage /> },
      { path: '/parametrizacion/sectores', element: <SectoresPage /> },
      { path: '/parametrizacion/categorias-activos', element: <CategoriasActivosPage /> },
      { path: '/parametrizacion/usuarios', element: <UsuariosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
