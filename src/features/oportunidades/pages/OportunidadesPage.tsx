import { useMemo, useState } from 'react';
import { KanbanSquare, List, Plus, Target, TrendingUp, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLanguage } from '@/lib/LanguageContext';
import type { Oportunidad } from '@/types';
import { formatCOP } from '@/lib/format';
import { responsables } from '@/data';
import { useOportunidades } from '../store';
import { useToast } from '@/hooks/useToast';
import { useMarcas } from '@/features/marcas/store';
import { useAcuerdos } from '@/features/acuerdos/store';
import { KanbanBoard } from '../components/KanbanBoard';
import { OportunidadFormModal } from '../components/OportunidadFormModal';
import { OportunidadTableRow } from '../components/OportunidadTableRow';

type Vista = 'kanban' | 'tabla';

export function OportunidadesPage() {
  const { t } = useLanguage();
  const { oportunidades, crearOportunidad, moverEtapa } = useOportunidades();
  const { mostrarToast } = useToast();
  const { marcas } = useMarcas();
  const { acuerdos } = useAcuerdos();

  const [vista, setVista] = useState<Vista>('kanban');
  const [marcaId, setMarcaId] = useState('todas');
  const [responsableId, setResponsableId] = useState('todos');
  const [modalAbierto, setModalAbierto] = useState(false);

  const filtradas = useMemo(() => {
    return oportunidades.filter((o) => {
      const coincideMarca = marcaId === 'todas' || o.marcaId === marcaId;
      const coincideResponsable = responsableId === 'todos' || o.responsableId === responsableId;
      return coincideMarca && coincideResponsable;
    });
  }, [oportunidades, marcaId, responsableId]);

  const abiertas = oportunidades.filter((o) => !['Firmada', 'Perdida', 'Cancelada'].includes(o.etapa));
  const ganadas = oportunidades.filter((o) => o.etapa === 'Firmada');
  const valorAbierto = abiertas.reduce((total, o) => {
    const valor = Number(o.valorEstimadoCOP) || 0;
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);

  async function handleCambiarEtapa(id: string, etapa: Oportunidad['etapa']) {
    try {
      // Validaciones para mover a "Firmada"
      if (etapa === 'Firmada') {
        const oportunidad = oportunidades.find((o) => o.id === id);

        // Validar que tenga contrato adjunto
        if (!oportunidad?.contratosAdjuntos || oportunidad.contratosAdjuntos.length === 0) {
          mostrarToast('Para firmar el contrato, debes adjuntar el contrato');
          return;
        }

        // Validar que tenga al menos un acuerdo
        const acuerdosRelacionados = acuerdos.filter((a) => a.oportunidadOrigenId === id);
        if (acuerdosRelacionados.length === 0) {
          mostrarToast('Para firmar el contrato, debes crear al menos un acuerdo');
          return;
        }
      }

      await moverEtapa(id, etapa);
      mostrarToast(t('message.oportunidadMovida').replace('{etapa}', etapa));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al mover la oportunidad';
      mostrarToast(errorMsg);
    }
  }

  async function handleCrear(valores: Omit<Oportunidad, 'id' | 'fechaCreacion' | 'actividad'>) {
    try {
      await crearOportunidad(valores);
      mostrarToast(t('message.oportunidadCreada'));
      setModalAbierto(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear la oportunidad';
      mostrarToast(errorMsg);
    }
  }

  return (
    <div>
      <PageHeader
        titulo={t('oportunidades.title')}
        descripcion={t('oportunidades.pipeline')}
        accion={
          <Button variante="primario" icono={<Plus size={16} />} onClick={() => setModalAbierto(true)}>
            {t('oportunidades.new')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard etiqueta={t('dashboard.oportunidadesAbiertas2')} valor={String(abiertas.length)} icono={Target} tono="marca" />
        <StatCard etiqueta={t('dashboard.valorPipeline2')} valor={formatCOP(valorAbierto)} icono={TrendingUp} tono="neutro" />
        <StatCard etiqueta={t('dashboard.ganadas')} valor={String(ganadas.length)} icono={Trophy} tono="exito" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <FilterSelect
            value={marcaId}
            onChange={(e) => setMarcaId(e.target.value)}
            options={[{ value: 'todas', label: 'Todas las marcas' }, ...marcas.map((m) => ({ value: m.id, label: m.nombre }))]}
          />
          <FilterSelect
            value={responsableId}
            onChange={(e) => setResponsableId(e.target.value)}
            options={[{ value: 'todos', label: t('filter.todosLosResponsables') }, ...responsables.map((r) => ({ value: r.id, label: r.nombre }))]}
          />
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setVista('kanban')}
            aria-pressed={vista === 'kanban'}
            className={`rounded-md p-1.5 ${vista === 'kanban' ? 'bg-brand-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <KanbanSquare size={16} />
          </button>
          <button
            type="button"
            onClick={() => setVista('tabla')}
            aria-pressed={vista === 'tabla'}
            className={`rounded-md p-1.5 ${vista === 'tabla' ? 'bg-brand-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icono={Target}
          titulo={t('empty.noOportunidades')}
          descripcion={t('empty.ajustaOportunidades')}
        />
      ) : vista === 'kanban' ? (
        <KanbanBoard oportunidades={filtradas} onCambiarEtapa={handleCambiarEtapa} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">{t('table.marca')}</th>
                <th className="px-4 py-3 font-medium">{t('table.etapa')}</th>
                <th className="px-4 py-3 font-medium">{t('table.estimado')}</th>
                <th className="px-4 py-3 font-medium">{t('table.responsable')}</th>
                <th className="px-4 py-3 font-medium">Última notificación</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o) => {
                const marca = marcas.find((m) => m.id === o.marcaId);
                return (
                  <OportunidadTableRow
                    key={o.id}
                    oportunidad={o}
                    marcaNombre={marca?.nombre ?? 'Sin marca'}
                    onCambiarEtapa={(etapa) => handleCambiarEtapa(o.id, etapa)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <OportunidadFormModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} onGuardar={handleCrear} />
    </div>
  );
}
