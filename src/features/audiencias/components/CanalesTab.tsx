import { useState } from 'react';
import {
  Briefcase,
  Camera,
  GraduationCap,
  Globe,
  Mail,
  MapPin,
  MessagesSquare,
  MousePointerClick,
  Music2,
  Radio,
  Send,
  ThumbsUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { activos } from '@/data';
import { formatNumero, formatPorcentaje } from '@/lib/format';
import { TIPOS_AUDIENCIA } from '@/types';
import type { CanalAudiencia } from '@/types';

const ICONOS_CANAL: Record<string, LucideIcon> = {
  'canal-email': Mail,
  'canal-newsletter': Send,
  'canal-sitio-web': Globe,
  'canal-landing': MousePointerClick,
  'canal-instagram': Camera,
  'canal-facebook': ThumbsUp,
  'canal-linkedin': Briefcase,
  'canal-tiktok': Music2,
  'canal-eventos': MapPin,
  'canal-cursos': GraduationCap,
  'canal-comunidad': MessagesSquare,
};

export function CanalesTab({ canales }: { canales: CanalAudiencia[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('todos');

  const filtrados = canales.filter((c) => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = tipo === 'todos' || c.tipo === tipo;
    return coincideBusqueda && coincideTipo;
  });

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        La audiencia propia corresponde a contactos identificados y autorizados. Los seguidores de redes
        sociales pertenecen a plataformas externas y no equivalen a una base de datos propia.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput placeholder="Buscar canal..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="sm:w-56" />
        <FilterSelect
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          options={[{ value: 'todos', label: 'Todos los tipos' }, ...TIPOS_AUDIENCIA.map((t) => ({ value: t, label: t }))]}
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icono={Radio} titulo="No hay canales que coincidan" descripcion="Ajusta la búsqueda o el filtro de tipo." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((canal) => {
            const Icono = ICONOS_CANAL[canal.id] ?? Radio;
            const activosRelacionados = canal.activosRelacionadosIds.map((id) => activos.find((a) => a.id === id)).filter(Boolean);

            return (
              <div key={canal.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800/10 text-brand-800">
                      <Icono size={16} />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{canal.nombre}</h4>
                      <Badge estado={canal.tipo} />
                    </div>
                  </div>
                  <Badge estado={canal.estado} />
                </div>

                <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <dt className="text-gray-500">Tamaño de audiencia</dt>
                    <dd className="font-medium text-gray-800">{formatNumero(canal.tamanoAudiencia)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Alcance del periodo</dt>
                    <dd className="font-medium text-gray-800">{formatNumero(canal.alcancePeriodo)}</dd>
                  </div>
                  {canal.tasaInteraccion !== undefined && (
                    <div>
                      <dt className="text-gray-500">Interacción</dt>
                      <dd className="font-medium text-gray-800">{formatPorcentaje(canal.tasaInteraccion, 1)}</dd>
                    </div>
                  )}
                  {canal.tasaConversion !== undefined && (
                    <div>
                      <dt className="text-gray-500">Conversión</dt>
                      <dd className="font-medium text-gray-800">{formatPorcentaje(canal.tasaConversion, 1)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500">Frecuencia</dt>
                    <dd className="font-medium text-gray-800">{canal.frecuenciaActivacion}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Segmentación</dt>
                    <dd className="font-medium text-gray-800">{canal.capacidadSegmentacion}</dd>
                  </div>
                </dl>

                <div className="mb-3 flex flex-wrap gap-1">
                  {canal.indicadoresDisponibles.map((indicador) => (
                    <span key={indicador} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                      {indicador}
                    </span>
                  ))}
                </div>

                <div className="mt-auto border-t border-gray-100 pt-2 text-xs text-gray-500">
                  {activosRelacionados.length === 0
                    ? 'Sin activos comerciales vinculados todavía.'
                    : `Activos relacionados: ${activosRelacionados.map((a) => a?.nombre).join(', ')}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
