import { useMemo, useState } from 'react';
import {
  Activity,
  Layers3,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Button } from '@/components/ui/Button';
import { canalesAudiencia, evolucionContactosPropios, segmentosAudiencia } from '@/data';
import { formatFechaHora, formatNumero, formatNumeroCompacto, formatPorcentaje } from '@/lib/format';
import { useAudiencias } from '../store';
import { useToast } from '@/hooks/useToast';
import type { CapacidadActivacion } from '@/types';
import {
  ComparacionCampanasChart,
  DistribucionSegmentosChart,
  EvolucionContactosChart,
  SeguidoresPorCanalChart,
} from './ResumenCharts';
import { CapacidadesActivacionSection } from './CapacidadesActivacionSection';

const PERIODOS = ['Últimos 30 días', 'Últimos 3 meses', 'Últimos 6 meses', 'Últimos 12 meses'] as const;
const MULTIPLICADOR_PERIODO: Record<(typeof PERIODOS)[number], number> = {
  'Últimos 30 días': 0.12,
  'Últimos 3 meses': 0.35,
  'Últimos 6 meses': 0.6,
  'Últimos 12 meses': 1,
};

const PROPIEDADES = ['Club principal — fútbol profesional', 'Categorías menores y academia'];
const TEMPORADAS = ['Temporada 2026', 'Temporada 2025'];

function promedioPonderado(items: { peso: number; valor?: number }[]): number {
  const conValor = items.filter((i) => i.valor !== undefined);
  const pesoTotal = conValor.reduce((s, i) => s + i.peso, 0);
  if (pesoTotal === 0) return 0;
  return conValor.reduce((s, i) => s + i.peso * (i.valor ?? 0), 0) / pesoTotal;
}

export function ResumenTab({ capacidades }: { capacidades: CapacidadActivacion[] }) {
  const { campanas, estadoIntegracionGO, refrescarDatos } = useAudiencias();
  const { mostrarToast } = useToast();

  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>('Últimos 12 meses');
  const [propiedad, setPropiedad] = useState(PROPIEDADES[0]);
  const [temporada, setTemporada] = useState(TEMPORADAS[0]);
  const [actualizando, setActualizando] = useState(false);

  const multiplicador = MULTIPLICADOR_PERIODO[periodo];

  const metrica = useMemo(() => {
    const canalEmail = canalesAudiencia.find((c) => c.id === 'canal-email');
    const canalesSociales = canalesAudiencia.filter((c) => c.tipo === 'Social');
    const segmentosPropios = segmentosAudiencia.filter((s) => s.tipoDato === 'Propia');

    const contactosPropios = canalEmail?.tamanoAudiencia ?? 0;
    const [penultimo, ultimo] = evolucionContactosPropios.slice(-2);
    const variacionContactos = penultimo && ultimo ? ((ultimo.contactos - penultimo.contactos) / penultimo.contactos) * 100 : 0;

    const seguidoresSociales = canalesSociales.reduce((s, c) => s + c.tamanoAudiencia, 0);
    const variacionSeguidores = promedioPonderado(
      canalesSociales.map((c) => ({ peso: c.tamanoAudiencia, valor: c.crecimientoPeriodo })),
    );

    const alcanceTotal = canalesAudiencia.reduce((s, c) => s + c.alcancePeriodo, 0);
    const alcancePeriodoActual = Math.round(alcanceTotal * multiplicador);
    const variacionAlcance = promedioPonderado(
      canalesAudiencia.map((c) => ({ peso: c.alcancePeriodo, valor: c.crecimientoPeriodo })),
    );

    const crecimientoBaseAnual = promedioPonderado(segmentosPropios.map((s) => ({ peso: s.tamano, valor: s.crecimiento })));
    const crecimientoBasePeriodo = crecimientoBaseAnual * multiplicador;

    const segmentosActivables = segmentosAudiencia.filter((s) => s.estado === 'Activable').length;

    const conTasa = canalesAudiencia.filter((c) => c.tasaInteraccion !== undefined);
    const tasaPromedioInteraccion = conTasa.length
      ? conTasa.reduce((s, c) => s + (c.tasaInteraccion ?? 0), 0) / conTasa.length
      : 0;

    return {
      contactosPropios,
      variacionContactos,
      seguidoresSociales,
      variacionSeguidores,
      alcancePeriodoActual,
      variacionAlcance,
      crecimientoBasePeriodo,
      segmentosActivables,
      tasaPromedioInteraccion,
    };
  }, [multiplicador]);

  function handleActualizar() {
    setActualizando(true);
    setTimeout(() => {
      refrescarDatos();
      setActualizando(false);
      mostrarToast('Datos actualizados (simulación). No hay conexión real con Sports Act GO todavía.', 'info');
    }, 700);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <FilterSelect
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as (typeof PERIODOS)[number])}
            options={PERIODOS.map((p) => ({ value: p, label: p }))}
          />
          <FilterSelect
            value={propiedad}
            onChange={(e) => setPropiedad(e.target.value)}
            options={PROPIEDADES.map((p) => ({ value: p, label: p }))}
          />
          <FilterSelect
            value={temporada}
            onChange={(e) => setTemporada(e.target.value)}
            options={TEMPORADAS.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Última actualización simulada
            <br />
            <span className="font-medium text-gray-700">{formatFechaHora(estadoIntegracionGO.ultimaActualizacionSimulada)}</span>
          </p>
          <Button
            variante="secundario"
            icono={<RefreshCw size={14} className={actualizando ? 'animate-spin' : ''} />}
            onClick={handleActualizar}
            disabled={actualizando}
          >
            {actualizando ? 'Actualizando...' : 'Actualizar datos'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Mostrando información agregada para <span className="font-medium text-gray-700">{propiedad}</span> ·{' '}
        <span className="font-medium text-gray-700">{temporada}</span> · {periodo.toLowerCase()}.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          etiqueta="Contactos propios autorizados"
          valor={formatNumero(metrica.contactosPropios)}
          icono={UserCheck}
          tono="marca"
          variacion={metrica.variacionContactos}
          nota="Dato propio — base de email (Sports Act GO)"
        />
        <StatCard
          etiqueta="Seguidores en redes sociales"
          valor={formatNumeroCompacto(metrica.seguidoresSociales)}
          icono={UsersRound}
          tono="neutro"
          variacion={metrica.variacionSeguidores}
          nota="Plataformas externas — no son contactos propios"
        />
        <StatCard
          etiqueta="Alcance digital del periodo"
          valor={formatNumeroCompacto(metrica.alcancePeriodoActual)}
          icono={TrendingUp}
          tono="exito"
          variacion={metrica.variacionAlcance}
          nota="Estimación combinando canales propios y sociales"
        />
        <StatCard
          etiqueta="Crecimiento de la base de datos"
          valor={formatPorcentaje(metrica.crecimientoBasePeriodo, 1)}
          icono={Activity}
          tono="exito"
          nota="Promedio ponderado de segmentos propios (estimado)"
        />
        <StatCard
          etiqueta="Segmentos activables"
          valor={formatNumero(metrica.segmentosActivables)}
          icono={Layers3}
          tono="marca"
          nota="Con información agregada lista para activarse"
        />
        <StatCard
          etiqueta="Tasa promedio de interacción"
          valor={formatPorcentaje(metrica.tasaPromedioInteraccion, 1)}
          icono={UsersRound}
          tono="neutro"
          nota="Promedio simple entre canales con dato disponible"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EvolucionContactosChart />
        <SeguidoresPorCanalChart />
        <DistribucionSegmentosChart />
        <ComparacionCampanasChart campanas={campanas} />
      </div>

      <CapacidadesActivacionSection capacidades={capacidades} />
    </div>
  );
}
