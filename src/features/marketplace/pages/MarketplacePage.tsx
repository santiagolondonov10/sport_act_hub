import { useState, useMemo, useEffect } from 'react';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { CATEGORIAS_ACTIVO } from '@/types';
import { authHeaders, getSessionUser } from '@/lib/auth';
import { ActivoMarketplaceCard } from '../components/ActivoMarketplaceCard';
import type { Activo } from '@/types';

// Mapa de categorías
const CATEGORIA_MAP: { [key: string]: string } = {
  'Camiseta y uniforme': 'Camiseta y uniforme',
  'Naming rights': 'Naming rights',
  'Vallas y pantallas': 'Vallas y pantallas',
  'Activos digitales': 'Activos digitales',
  'Hospitality': 'Hospitality',
  'Activaciones': 'Activaciones',
  'Derechos de contenido': 'Derechos de contenido',
  'Presencia en eventos': 'Presencia en eventos',
  'Experiencias': 'Experiencias',
};

type VistaMarketplace = 'grid' | 'compania' | 'categoria' | 'valoracion';

export function MarketplacePage() {
  const [activos, setActivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [seleccionado, setSeleccionado] = useState<Activo | null>(null);
  const [vista, setVista] = useState<VistaMarketplace>('grid');

  useEffect(() => {
    const cargarActivos = async () => {
      try {
        setLoading(true);
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        // No incluir x-compania-id para obtener activos de todas las compañías
        headers.delete('x-compania-id');

        const response = await fetch(`/api/activos`, { headers });
        if (response.ok) {
          const data = await response.json();

          // Filtrar solo los activos en estado "Disponible"
          const disponibles = Array.isArray(data) ? data.filter((a: any) => a.estado === 'Disponible') : [];

          // Obtener información de compañías
          const companias = new Map();
          for (const activo of disponibles) {
            const companiaId = activo.compania_id || activo.company_id || activo.companiaId;

            if (companiaId && !companias.has(companiaId)) {
              try {
                const compHeaders = new Headers();
                Object.entries(auth).forEach(([key, value]) => {
                  if (value) compHeaders.set(key, value);
                });
                const compResponse = await fetch(`/api/admin/companias/${companiaId}`, { headers: compHeaders });
                if (compResponse.ok) {
                  const compData = await compResponse.json();
                  companias.set(companiaId, compData);
                }
              } catch (error) {
                console.error('Error loading company:', error);
              }
            }
          }

          // Agregar información de compañía y categoría a cada activo
          const activosConCompania = disponibles.map((a: any) => {
            const companiaId = a.compania_id || a.company_id || a.companiaId;
            const compData = companias.get(companiaId);
            // Usar categoriaNombre si viene del API, sino usar el nombre de la categoría o el mapa
            let categoriaNombre = a.categoriaNombre || a.categoria_nombre || 'Sin categoría';
            if (categoriaNombre === 'Sin categoría') {
              categoriaNombre = CATEGORIA_MAP[a.categoriaId] || a.categoriaId || 'Sin categoría';
            }
            return {
              ...a,
              compania_nombre: compData?.nombre || compData?.name || 'Compañía',
              compania_logo: compData?.logo_url || compData?.logo || '',
              categoriaNombre: categoriaNombre,
            };
          });

          setActivos(activosConCompania);
        } else {
          console.error('Error loading activos:', response.status);
          setActivos([]);
        }
      } catch (error) {
        console.error('Error loading marketplace activos:', error);
        setActivos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarActivos();
  }, []);

  const disponibles = useMemo(() => {
    return activos.filter((a) => a.estado === 'Disponible');
  }, [activos]);

  const filtrados = useMemo(() => {
    return disponibles.filter((a) => {
      const coincideBusqueda =
        (a.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.canal ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoria === 'todas' || a.categoriaId === categoria;
      return coincideBusqueda && coincideCategoria;
    });
  }, [disponibles, busqueda, categoria]);

  const valorTotal = filtrados.reduce((total, a) => {
    const valor = typeof a.valoracionCOP === 'string' ? parseFloat(a.valoracionCOP) : (a.valoracionCOP || 0);
    return total + valor;
  }, 0);

  const valorMinimo = filtrados.length > 0
    ? Math.min(...filtrados.map(a => {
        const valor = typeof a.valoracionCOP === 'string' ? parseFloat(a.valoracionCOP) : (a.valoracionCOP || 0);
        return valor;
      }))
    : 0;

  const valorMaximo = filtrados.length > 0
    ? Math.max(...filtrados.map(a => {
        const valor = typeof a.valoracionCOP === 'string' ? parseFloat(a.valoracionCOP) : (a.valoracionCOP || 0);
        return valor;
      }))
    : 0;

  const companiasUnicas = new Set(filtrados.map(a => a.compania_nombre)).size;

  return (
    <div>
      <PageHeader
        titulo="Marketplace de Activos Comerciales"
        descripcion="Descubre activos disponibles de propiedades y eventos deportivos"
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Activos que coinciden</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(filtrados.length)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Valor Total del Inventario</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Rango de Inversión</p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            {formatCurrency(valorMinimo)} - {formatCurrency(valorMaximo)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Compañías Disponibles</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(companiasUnicas)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            placeholder="Buscar por nombre, canal o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <FilterSelect
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            options={[{ value: 'todas', label: 'Todas las categorías' }, ...CATEGORIAS_ACTIVO.map((c) => ({ value: c, label: c }))]}
          />
        </div>

        {/* Botones de visualización */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1 w-fit">
          <button
            type="button"
            onClick={() => setVista('grid')}
            aria-pressed={vista === 'grid'}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              vista === 'grid' ? 'bg-brand-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Grid
          </button>
          <button
            type="button"
            onClick={() => setVista('compania')}
            aria-pressed={vista === 'compania'}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              vista === 'compania' ? 'bg-brand-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🏢 Por Compañía
          </button>
          <button
            type="button"
            onClick={() => setVista('categoria')}
            aria-pressed={vista === 'categoria'}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              vista === 'categoria' ? 'bg-brand-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📦 Por Categoría
          </button>
          <button
            type="button"
            onClick={() => setVista('valoracion')}
            aria-pressed={vista === 'valoracion'}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              vista === 'valoracion' ? 'bg-brand-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💰 Por Valoración
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icono={Package}
          titulo="No hay activos disponibles"
          descripcion="No hay activos que coincidan con tu búsqueda"
        />
      ) : vista === 'grid' ? (
        <VistaGrid activos={filtrados} onSeleccionar={setSeleccionado} />
      ) : vista === 'compania' ? (
        <VistaCompania activos={filtrados} onSeleccionar={setSeleccionado} />
      ) : vista === 'categoria' ? (
        <VistaCategoria activos={filtrados} onSeleccionar={setSeleccionado} />
      ) : (
        <VistaValoracion activos={filtrados} onSeleccionar={setSeleccionado} />
      )}

      {seleccionado && (
        <ActivoDetalleModal
          activo={seleccionado as any}
          companiaId={(seleccionado as any).compania_id || (seleccionado as any).company_id || (seleccionado as any).companiaId || ''}
          onCerrar={() => setSeleccionado(null)}
        />
      )}
    </div>
  );
}

function VistaGrid({ activos, onSeleccionar }: { activos: any[]; onSeleccionar: (a: any) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {activos.map((activo) => (
        <ActivoMarketplaceCard
          key={activo.id}
          activo={activo}
          onSeleccionar={() => onSeleccionar(activo)}
        />
      ))}
    </div>
  );
}

function VistaCompania({ activos, onSeleccionar }: { activos: any[]; onSeleccionar: (a: any) => void }) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set(Array.from(new Map<string, any[]>(), ([k]) => k)));

  const agrupadosPorCompania = new Map<string, any[]>();
  activos.forEach((activo: any) => {
    const compania = activo.compania_nombre || 'Sin compañía';
    if (!agrupadosPorCompania.has(compania)) {
      agrupadosPorCompania.set(compania, []);
    }
    agrupadosPorCompania.get(compania)?.push(activo);
  });

  const toggleCompania = (compania: string) => {
    const nuevas = new Set(expandidas);
    if (nuevas.has(compania)) {
      nuevas.delete(compania);
    } else {
      nuevas.add(compania);
    }
    setExpandidas(nuevas);
  };

  return (
    <div className="space-y-3">
      {Array.from(agrupadosPorCompania.entries()).map(([compania, items]) => {
        const estaExpandida = expandidas.has(compania);
        return (
          <div key={compania} className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCompania(compania)}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 px-4 py-3 text-white font-semibold flex items-center justify-between transition-colors"
            >
              <span>{compania} ({items.length})</span>
              <span className={`transition-transform ${estaExpandida ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {estaExpandida && (
              <div className="grid gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 bg-gray-50">
                {items.map((activo) => (
                  <ActivoMarketplaceCard
                    key={activo.id}
                    activo={activo}
                    onSeleccionar={() => onSeleccionar(activo)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VistaCategoria({ activos, onSeleccionar }: { activos: any[]; onSeleccionar: (a: any) => void }) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const agrupadosPorCategoria = new Map<string, any[]>();
  activos.forEach((activo: any) => {
    const categoriaNombre = activo.categoriaNombre || CATEGORIA_MAP[activo.categoriaId] || 'Sin categoría';
    if (!agrupadosPorCategoria.has(categoriaNombre)) {
      agrupadosPorCategoria.set(categoriaNombre, []);
    }
    agrupadosPorCategoria.get(categoriaNombre)?.push(activo);
  });

  // Inicializar expandidas al cargar
  const categoriasKeys = Array.from(agrupadosPorCategoria.keys());
  if (expandidas.size === 0 && categoriasKeys.length > 0) {
    setExpandidas(new Set(categoriasKeys));
  }

  const toggleCategoria = (categoria: string) => {
    const nuevas = new Set(expandidas);
    if (nuevas.has(categoria)) {
      nuevas.delete(categoria);
    } else {
      nuevas.add(categoria);
    }
    setExpandidas(nuevas);
  };

  return (
    <div className="space-y-3">
      {Array.from(agrupadosPorCategoria.entries()).map(([categoria, items]) => {
        const estaExpandida = expandidas.has(categoria);
        return (
          <div key={categoria} className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCategoria(categoria)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-3 text-white font-semibold flex items-center justify-between transition-colors"
            >
              <span>📦 {categoria} ({items.length})</span>
              <span className={`transition-transform ${estaExpandida ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {estaExpandida && (
              <div className="grid gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 bg-gray-50">
                {items.map((activo) => (
                  <ActivoMarketplaceCard
                    key={activo.id}
                    activo={activo}
                    onSeleccionar={() => onSeleccionar(activo)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VistaValoracion({ activos, onSeleccionar }: { activos: any[]; onSeleccionar: (a: any) => void }) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const getRangoValoracion = (valor: number) => {
    if (valor < 50000000) return { label: 'Valor Bajo', descripcion: 'Menor a $50M', min: 0, max: 50000000 };
    if (valor <= 200000000) return { label: 'Valor Medio', descripcion: '$50M - $200M', min: 50000000, max: 200000000 };
    return { label: 'Valor Alto', descripcion: 'Mayor a $200M', min: 200000000, max: Infinity };
  };

  const agrupadosPorValoracion = new Map<string, any[]>();
  activos.forEach((activo: any) => {
    const rango = getRangoValoracion(activo.valoracionCOP || 0);
    if (!agrupadosPorValoracion.has(rango.label)) {
      agrupadosPorValoracion.set(rango.label, []);
    }
    agrupadosPorValoracion.get(rango.label)?.push(activo);
  });

  // Inicializar expandidas al cargar
  const rangosKeys = Array.from(agrupadosPorValoracion.keys());
  if (expandidas.size === 0 && rangosKeys.length > 0) {
    setExpandidas(new Set(rangosKeys));
  }

  const toggleValoracion = (label: string) => {
    const nuevas = new Set(expandidas);
    if (nuevas.has(label)) {
      nuevas.delete(label);
    } else {
      nuevas.add(label);
    }
    setExpandidas(nuevas);
  };

  const orden = ['Valor Bajo', 'Valor Medio', 'Valor Alto'];

  return (
    <div className="space-y-3">
      {orden.map((label) => {
        const items = agrupadosPorValoracion.get(label) || [];
        if (items.length === 0) return null;
        const totalValor = items.reduce((sum: number, a: any) => sum + (a.valoracionCOP || 0), 0);
        const estaExpandida = expandidas.has(label);
        const rango = getRangoValoracion(items[0]?.valoracionCOP || 0);

        return (
          <div key={label} className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleValoracion(label)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 py-3 text-white font-semibold flex items-center justify-between transition-colors"
            >
              <div className="text-left">
                <div>{label} ({items.length})</div>
                <div className="text-xs font-normal text-purple-100">{rango.descripcion} • total activos en esta agrupación: {formatCurrency(totalValor)}</div>
              </div>
              <span className={`transition-transform flex-shrink-0 ml-2`}>
                {estaExpandida ? '▼' : '▶'}
              </span>
            </button>
            {estaExpandida && (
              <div className="grid gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 bg-gray-50">
                {items.map((activo) => (
                  <ActivoMarketplaceCard
                    key={activo.id}
                    activo={activo}
                    onSeleccionar={() => onSeleccionar(activo)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivoDetalleModal({ activo, companiaId, onCerrar }: { activo: any; companiaId: string; onCerrar: () => void }) {
  const [enviandoInteres, setEnviandoInteres] = useState(false);
  const [mensajeInteres, setMensajeInteres] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleEstoyInteresado = async () => {
    try {
      setEnviandoInteres(true);
      setMensajeInteres(null);

      const user = getSessionUser();
      if (!user || !user.email) {
        setMensajeInteres({ tipo: 'error', texto: 'Debes estar autenticado para expresar interés.' });
        setEnviandoInteres(false);
        return;
      }

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      Object.entries(authHeaders()).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });

      const response = await fetch('/api/marketplace/interes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          activoId: activo.id,
          companiaId: companiaId,
          interesadoEmail: user.email,
          interesadoNombre: user.username || user.email,
        }),
      });

      if (response.ok) {
        setMensajeInteres({ tipo: 'exito', texto: '¡Interés registrado! El equipo de la compañía se contactará contigo pronto.' });
        setTimeout(() => onCerrar(), 2000);
      } else {
        const error = await response.json();
        setMensajeInteres({ tipo: 'error', texto: error.error || 'No fue posible registrar tu interés.' });
      }
    } catch (error) {
      setMensajeInteres({ tipo: 'error', texto: 'Error al registrar tu interés. Por favor, intenta de nuevo.' });
    } finally {
      setEnviandoInteres(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{activo.nombre}</h2>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {activo.fotos && activo.fotos.length > 0 && (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img
                src={`/api/activos/${activo.id}/fotos/${activo.fotos[0].id}`}
                alt={activo.nombre}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Canal</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{activo.canal || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Categoría</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{activo.categoriaNombre || activo.categoriaId || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Valoración</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(activo.valoracionCOP || 0)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Inventario</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{activo.inventarioDisponible}/{activo.inventarioTotal}</p>
            </div>
          </div>

          {activo.descripcion && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Descripción</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{activo.descripcion}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Alcance Estimado</p>
            <p className="text-sm font-semibold text-gray-900">{formatNumber(activo.alcanceEstimado || 0)} personas</p>
          </div>

          {mensajeInteres && (
            <div
              className={`p-4 rounded-lg ${
                mensajeInteres.tipo === 'exito'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{mensajeInteres.texto}</p>
            </div>
          )}

          <button
            onClick={handleEstoyInteresado}
            disabled={enviandoInteres}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            {enviandoInteres ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando interés...
              </span>
            ) : (
              '🎯 Estoy Interesado'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
