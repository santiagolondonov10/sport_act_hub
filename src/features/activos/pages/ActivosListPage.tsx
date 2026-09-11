import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Package, PackageCheck, PackageX, Plus, Image as ImageIcon, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLanguage } from '@/lib/LanguageContext';
import { CATEGORIAS_ACTIVO, ESTADOS_ACTIVO } from '@/types';
import { formatCOP, formatNumero } from '@/lib/format';
import { useActivos } from '../store';
import { useToast } from '@/hooks/useToast';
import { getSessionUser, authHeaders } from '@/lib/auth';
import { ActivoFormModal } from '../components/ActivoFormModal';
import { ActivoCard } from '../components/ActivoCard';
import { FotoPreviewModal } from '../components/FotoPreviewModal';

type Vista = 'tabla' | 'tarjetas';


export function ActivosListPage() {
  const { t } = useLanguage();
  const { activos, crearActivo } = useActivos();
  const { mostrarToast } = useToast();
  const sessionUser = getSessionUser();

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [estado, setEstado] = useState('todos');
  const [vista, setVista] = useState<Vista>('tabla');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [companiaNombre, setCompaniaNombre] = useState('');
  const [previewFotoAbierto, setPreviewFotoAbierto] = useState(false);
  const [fotoPreviewSeleccionada, setFotoPreviewSeleccionada] = useState<{ activoId: string; fotoId: string; nombre: string } | null>(null);

  useEffect(() => {
    if (sessionUser?.companiaId) {
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      fetch(`/api/admin/companias/${sessionUser.companiaId}`, { headers })
        .then((res) => res.json())
        .then((data: any) => setCompaniaNombre(data.nombre || ''))
        .catch(() => setCompaniaNombre(''));
    }
  }, [sessionUser?.companiaId]);

  const filtrados = useMemo(() => {
    return activos.filter((a) => {
      const coincideBusqueda =
        (a.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.canal ?? '').toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoria === 'todas' || a.categoriaId === categoria;
      const coincideEstado = estado === 'todos' || a.estado === estado;
      return coincideBusqueda && coincideCategoria && coincideEstado;
    });
  }, [activos, busqueda, categoria, estado]);

  async function handleCrear(valores: any) {
    try {
      await crearActivo(valores);
      mostrarToast(t('message.activoCreado'));
      setModalAbierto(false);
    } catch (error) {
      mostrarToast('Error al crear el activo');
    }
  }

  const disponibles = activos.filter((a) => a.estado === 'Disponible').length;
  const comprometidos = activos.filter((a) => a.estado === 'Reservado' || a.estado === 'Vendido').length;

  return (
    <div>
      <PageHeader
        titulo={t('activos.title')}
        descripcion={t('activos.catalogo')}
        accion={
          <Button variante="primario" icono={<Plus size={16} />} onClick={() => setModalAbierto(true)}>
            {t('activos.new')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard etiqueta={t('dashboard.totalActivos')} valor={formatNumero(activos.length)} icono={Package} tono="marca" />
        <StatCard etiqueta={t('dashboard.disponibles')} valor={formatNumero(disponibles)} icono={PackageCheck} tono="exito" />
        <StatCard etiqueta={t('dashboard.comprometidos')} valor={formatNumero(comprometidos)} icono={PackageX} tono="advertencia" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <SearchInput
            placeholder={t('search.nombreCanal')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:w-64"
          />
          <FilterSelect
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            options={[{ value: 'todas', label: t('filter.todasLasCategorias') }, ...CATEGORIAS_ACTIVO.map((c) => ({ value: c, label: c }))]}
          />
          <FilterSelect
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[{ value: 'todos', label: t('filter.todosLosEstados') }, ...ESTADOS_ACTIVO.map((e) => ({ value: e, label: e }))]}
          />
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setVista('tabla')}
            aria-label="Ver como tabla"
            aria-pressed={vista === 'tabla'}
            className={`rounded-md p-1.5 ${vista === 'tabla' ? 'bg-brand-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setVista('tarjetas')}
            aria-label="Ver como tarjetas"
            aria-pressed={vista === 'tarjetas'}
            className={`rounded-md p-1.5 ${vista === 'tarjetas' ? 'bg-brand-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icono={Package}
          titulo={t('empty.noActivos')}
          descripcion={t('empty.ajustaActivos')}
          accion={
            <Button variante="primario" icono={<Plus size={16} />} onClick={() => setModalAbierto(true)}>
              {t('activos.new')}
            </Button>
          }
        />
      ) : vista === 'tarjetas' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((activo) => (
            <ActivoCard key={activo.id} activo={activo} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">{t('table.activo')}</th>
                <th className="px-4 py-3 font-medium">{t('table.categoria')}</th>
                <th className="px-4 py-3 font-medium">{t('table.valoracion')}</th>
                <th className="px-4 py-3 font-medium">{t('table.inventario')}</th>
                <th className="px-4 py-3 font-medium">Compañía</th>
                <th className="px-4 py-3 font-medium">{t('table.estado')}</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((activo) => {
                const fotoActivo = activo.fotos?.[0];
                return (
                <tr key={activo.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    {fotoActivo ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFotoPreviewSeleccionada({
                              activoId: activo.id,
                              fotoId: fotoActivo.id,
                              nombre: fotoActivo.nombreArchivo
                            });
                            setPreviewFotoAbierto(true);
                          }}
                          className="h-10 w-10 rounded overflow-hidden hover:ring-2 hover:ring-brand-400 transition-all group"
                          title="Click para ampliar"
                        >
                          <img
                            src={`/api/activos/${activo.id}/fotos/${fotoActivo.id}`}
                            alt={activo.nombre}
                            className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        </button>
                        <a
                          href={`/api/activos/${activo.id}/fotos/${fotoActivo.id}`}
                          download={fotoActivo.nombreArchivo}
                          title="Descargar foto"
                          className="text-gray-400 hover:text-brand-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/activos/${activo.id}`} className="font-medium text-gray-900 hover:text-brand-800 hover:underline">
                      {activo.nombre}
                    </Link>
                    <p className="text-xs text-gray-500">{activo.canal}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{activo.categoriaNombre || 'Sin categoría'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCOP(activo.valoracionCOP)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {activo.inventarioDisponible}/{activo.inventarioTotal}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{companiaNombre}</td>
                  <td className="px-4 py-3">
                    <Badge estado={activo.estado} />
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ActivoFormModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} onGuardar={handleCrear} />

      {fotoPreviewSeleccionada && (
        <FotoPreviewModal
          abierto={previewFotoAbierto}
          onCerrar={() => {
            setPreviewFotoAbierto(false);
            setFotoPreviewSeleccionada(null);
          }}
          activoId={fotoPreviewSeleccionada.activoId}
          fotoId={fotoPreviewSeleccionada.fotoId}
          nombreArchivo={fotoPreviewSeleccionada.nombre}
        />
      )}
    </div>
  );
}
