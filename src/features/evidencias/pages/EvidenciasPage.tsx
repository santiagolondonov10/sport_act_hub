import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, FolderCheck, Plus, XCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/useToast';
import { EvidenciaCard } from '../components/EvidenciaCard';
import { EvidenciaFormModal } from '../components/EvidenciaFormModal';
import { EvidenciaDetalleModal } from '../components/EvidenciaDetalleModal';

const ESTADOS: EstadoEvidencia[] = ['En revisión', 'Aprobada', 'Rechazada'];

export function EvidenciasPage() {
  const { t } = useLanguage();
  const { evidencias, crearEvidencia, actualizarEvidencia, cambiarEstado } = useEvidencias();
  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();
  const { compromisos } = useCompromisos();
  const { mostrarToast } = useToast();
  const [searchParams] = useSearchParams();

  const [busqueda, setBusqueda] = useState('');
  const [acuerdoId, setAcuerdoId] = useState('todos');
  const [compromiso, setCompromiso] = useState(() => searchParams.get('compromiso') || 'todos');
  const [tipo, setTipo] = useState('todos');
  const [estado, setEstado] = useState('todos');
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
      return coincideBusqueda && coincideAcuerdo && coincideCompromiso && coincideTipo && coincideEstado;
    });
  }, [evidencias, busqueda, acuerdoId, compromiso, tipo, estado]);

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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icono={FolderCheck}
          titulo={t('empty.noEvidencias')}
          descripcion={t('empty.ajustaEvidencias')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtradas.map((evidencia) => (
            <EvidenciaCard key={evidencia.id} evidencia={evidencia} onSeleccionar={() => setSeleccionada(evidencia)} />
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
        onCambiarEstado={handleCambiarEstado}
        onEditar={handleEditar}
      />
    </div>
  );
}
