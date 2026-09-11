import { Wallet, TrendingUp, Package, FileSignature, CheckCircle2, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { useLanguage } from '@/lib/LanguageContext';
import { formatCOPCompact, formatNumero, formatPorcentaje } from '@/lib/format';
import {
  getValorPipeline,
  getIngresosCerrados,
  getActivosDisponiblesCount,
  getAcuerdosActivosCount,
  getCumplimientoGeneral,
  getCompromisosVencidosCount,
} from '@/lib/selectors';
import { PipelineChart } from './components/PipelineChart';
import { CumplimientoChart } from './components/CumplimientoChart';
import { CompromisosPorEstado } from './components/CompromisosPorEstado';
import { AlertasOperativas } from './components/AlertasOperativas';
import { ActividadReciente } from './components/ActividadReciente';
import { AcuerdosRelevantesTable } from './components/AcuerdosRelevantesTable';
import { AccesosRapidos } from './components/AccesosRapidos';
import { ValorAudiencia } from './components/ValorAudiencia';

export function DashboardPage() {
  const { t } = useLanguage();

  const valorPipeline = getValorPipeline();
  const ingresosCerrados = getIngresosCerrados();
  const activosDisponibles = getActivosDisponiblesCount();
  const acuerdosActivos = getAcuerdosActivosCount();
  const cumplimientoGeneral = getCumplimientoGeneral();
  const compromisosVencidos = getCompromisosVencidosCount();

  return (
    <div>
      <PageHeader
        titulo={t('dashboard.title')}
        descripcion={t('dashboard.operacion')}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          etiqueta={t('dashboard.valorPipeline')}
          valor={formatCOPCompact(valorPipeline)}
          icono={TrendingUp}
          tono="marca"
          nota={t('dashboard.oportunidadesAbiertas')}
        />
        <StatCard
          etiqueta={t('dashboard.ingresosCerrados')}
          valor={formatCOPCompact(ingresosCerrados)}
          icono={Wallet}
          tono="exito"
          nota={t('dashboard.acuerdosActivos')}
        />
        <StatCard
          etiqueta={t('dashboard.activosDisponibles')}
          valor={formatNumero(activosDisponibles)}
          icono={Package}
          tono="neutro"
          nota={t('dashboard.listosNegociar')}
        />
        <StatCard
          etiqueta={t('dashboard.acuerdosActivos')}
          valor={formatNumero(acuerdosActivos)}
          icono={FileSignature}
          tono="marca"
          nota={t('dashboard.incluyeProximosVencer')}
        />
        <StatCard
          etiqueta={t('dashboard.cumplimientoGeneral')}
          valor={formatPorcentaje(cumplimientoGeneral)}
          icono={CheckCircle2}
          tono="exito"
          nota={t('dashboard.compromisoCumplidos')}
        />
        <StatCard
          etiqueta={t('dashboard.compromisosVencidos')}
          valor={formatNumero(compromisosVencidos)}
          icono={TriangleAlert}
          tono="peligro"
          nota={t('dashboard.requierenAtencion')}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PipelineChart />
        <CumplimientoChart />
      </div>

      <div className="mb-6">
        <ValorAudiencia />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CompromisosPorEstado />
        <AlertasOperativas />
        <ActividadReciente />
      </div>

      <div className="mb-6">
        <AcuerdosRelevantesTable />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('dashboard.accesosRapidos')}</h3>
        <AccesosRapidos />
      </div>
    </div>
  );
}
