import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, FolderCheck, KanbanSquare, List, Plus, XCircle } from 'lucide-react';
import { authHeaders } from '@/lib/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLanguage } from '@/lib/LanguageContext';
import { TIPOS_EVIDENCIA } from '@/types';
import type { Evidencia, EstadoEvidencia } from '@/types';
import { useEvidencias } from '../store';
import { useAcuerdos } from '@/features/acuerdos/store';
import { useMarcas } from '@/features/marcas/store';
import { useCompromisos } from '@/features/compromisos/store';
import { useActivos } from '@/features/activos/store';
import { useToast } from '@/hooks/useToast';
import { EvidenciaCard } from '../components/EvidenciaCard';
import { EvidenciaFormModal } from '../components/EvidenciaFormModal';
import { EvidenciaDetalleModal } from '../components/EvidenciaDetalleModal';
import { EvidenciasKanbanBoard } from '../components/EvidenciasKanbanBoard';

type Vista = 'kanban' | 'tabla';

const ESTADOS: EstadoEvidencia[] = ['En revisión', 'Aprobada', 'Rechazada'];

export function EvidenciasPage() {
  const { t } = useLanguage();
  const { evidencias, crearEvidencia, actualizarEvidencia, cambiarEstado } = useEvidencias();
  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();
  const { compromisos } = useCompromisos();
  const { activos } = useActivos();
  const { mostrarToast } = useToast();
  const [searchParams] = useSearchParams();

  const [vista, setVista] = useState<Vista>('kanban');
  const [busqueda, setBusqueda] = useState('');
  const [acuerdoId, setAcuerdoId] = useState('todos');
  const [compromiso, setCompromiso] = useState(() => searchParams.get('compromiso') || 'todos');
  const [tipo, setTipo] = useState('todos');
  const [estado, setEstado] = useState('todos');
  const [activoId, setActivoId] = useState('todos');
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Evidencia | null>(null);
  const [evidenciaEditando, setEvidenciaEditando] = useState<Evidencia | null>(null);

  const filtradas = useMemo(() => {
    return evidencias.filter((e) => {
      const coincideBusqueda =
        e.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      const coincideAcuerdo = acuerdoId === 'todos' || e.acuerdoId === acuerdoId;
      const coincideCompromiso = compromiso === 'todos' || e.compromisoId === compromiso;
      const coincideTipo = tipo === 'todos' || e.tipo === tipo;
      const coincideEstado = estado === 'todos' || e.estado === estado;
      const coincideActivo = activoId === 'todos' || (e.activoId && e.activoId === activoId);
      return coincideBusqueda && coincideAcuerdo && coincideCompromiso && coincideTipo && coincideEstado && coincideActivo;
    });
  }, [evidencias, busqueda, acuerdoId, compromiso, tipo, estado, activoId]);

  const aprobadas = evidencias.filter((e) => e.estado === 'Aprobada').length;
  const enRevision = evidencias.filter((e) => e.estado === 'En revisión').length;
  const rechazadas = evidencias.filter((e) => e.estado === 'Rechazada').length;

  async function handleGuardar(valores: Omit<Evidencia, 'id' | 'estado'>) {
    try {
      if (evidenciaEditando) {
        await actualizarEvidencia(evidenciaEditando.id, valores);
        mostrarToast(t('message.evidenciaActualizada'));
        setEvidenciaEditando(null);
      } else {
        await crearEvidencia(valores);
        mostrarToast(t('message.evidenciaRegistrada'));
      }
      setModalCrearAbierto(false);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No fue posible guardar la evidencia.';
      mostrarToast(mensaje, 'error');
    }
  }

  function handleEditar(evidencia: Evidencia) {
    setEvidenciaEditando(evidencia);
    setModalCrearAbierto(true);
  }

  function handleCambiarEstado(id: string, nuevoEstado: EstadoEvidencia) {
    cambiarEstado(id, nuevoEstado);
    mostrarToast(nuevoEstado === 'Aprobada' ? t('message.evidenciaAprobada') : t('message.evidenciaRechazada'), nuevoEstado === 'Aprobada' ? 'exito' : 'error');
    setSeleccionada(null);
  }

  async function handleSolicitarRevision(evidenciaId: string) {
    if (!confirm('¿Deseas enviar una solicitud de revisión a la marca?')) return;

    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      Object.entries(authHeaders()).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });

      const response = await fetch(`/api/evidencias/${evidenciaId}/solicitar-revision`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud de revisión');
      }

      mostrarToast('Solicitud de revisión enviada correctamente.');
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'Error al enviar la solicitud.', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        titulo={t('evidencias.title')}
        descripcion={t('evidencias.repositorio')}
        accion={
          <Button variante="primario" icono={<Plus size={16} />} onClick={() => setModalCrearAbierto(true)}>
            {t('action.registrarEvidencia')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard etiqueta={t('dashboard.totalEvidencias')} valor={String(evidencias.length)} icono={FolderCheck} tono="marca" />
        <StatCard etiqueta={t('dashboard.aprobadas')} valor={String(aprobadas)} icono={CheckCircle2} tono="exito" />
        <StatCard etiqueta={t('dashboard.enRevision')} valor={String(enRevision)} icono={Clock} tono="advertencia" />
        <StatCard etiqueta={t('dashboard.rechazadas')} valor={String(rechazadas)} icono={XCircle} tono={rechazadas > 0 ? 'peligro' : 'neutro'} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SearchInput
            placeholder={t('search.evidencia')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:w-56"
          />
          <FilterSelect
            value={acuerdoId}
            onChange={(e) => setAcuerdoId(e.target.value)}
            options={[
              { value: 'todos', label: t('filter.todosLosAcuerdos') },
              ...acuerdos.map((a) => ({ value: a.id, label: `${a.nombre} — ${marcas.find((m) => m.id === a.marcaId)?.nombre ?? ''}` })),
            ]}
          />
          <FilterSelect
            value={compromiso}
            onChange={(e) => setCompromiso(e.target.value)}
            options={[
              { value: 'todos', label: 'Todos los compromisos' },
              ...compromisos.map((c) => ({ value: c.id, label: c.entregable })),
            ]}
          />
          <FilterSelect
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            options={[{ value: 'todos', label: t('filter.todoLosTipos') }, ...TIPOS_EVIDENCIA.map((t) => ({ value: t, label: t }))]}
          />
          <FilterSelect
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[{ value: 'todos', label: t('filter.todosLosEstados') }, ...ESTADOS.map((e) => ({ value: e, label: e }))]}
          />
          <FilterSelect
            value={activoId}
            onChange={(e) => setActivoId(e.target.value)}
            options={[{ value: 'todos', label: 'Todos los activos' }, ...activos.map((a) => ({ value: a.id, label: a.nombre }))]}
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
          icono={FolderCheck}
          titulo={t('empty.noEvidencias')}
          descripcion={t('empty.ajustaEvidencias')}
        />
      ) : vista === 'kanban' ? (
        <EvidenciasKanbanBoard evidencias={filtradas} onCambiarEstado={handleCambiarEstado} onSeleccionar={(e) => setSeleccionada(e)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtradas.map((evidencia) => (
            <EvidenciaCard
              key={evidencia.id}
              evidencia={evidencia}
              onSeleccionar={() => setSeleccionada(evidencia)}
              onSolicitarRevision={() => handleSolicitarRevision(evidencia.id)}
            />
          ))}
        </div>
      )}

      <EvidenciaFormModal
        abierto={modalCrearAbierto}
        onCerrar={() => {
          setModalCrearAbierto(false);
          setEvidenciaEditando(null);
        }}
        onGuardar={handleGuardar}
        evidenciaInicial={evidenciaEditando || undefined}
      />
      <EvidenciaDetalleModal
        evidencia={seleccionada}
        onCerrar={() => setSeleccionada(null)}
        onEditar={handleEditar}
        onSolicitarRevision={() => {
          if (seleccionada) {
            handleSolicitarRevision(seleccionada.id);
          }
        }}
      />
    </div>
  );
}
