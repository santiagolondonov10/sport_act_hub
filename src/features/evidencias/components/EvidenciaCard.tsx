import {
  Camera,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Link2,
  Mail,
  Megaphone,
  Monitor,
  MousePointerClick,
  Share2,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatFecha } from '@/lib/format';
import { useAcuerdos } from '@/features/acuerdos/store';
import { useMarcas } from '@/features/marcas/store';
import type { Evidencia, TipoEvidencia } from '@/types';

const ICONOS_TIPO: Record<TipoEvidencia, LucideIcon> = {
  Fotografía: ImageIcon,
  'Captura de pantalla': Monitor,
  Enlace: Link2,
  Documento: FileText,
  'Captura de campaña': Megaphone,
  'Informe de email': Mail,
  'Resultado de landing': MousePointerClick,
  'Registro de participantes': ClipboardList,
  'Evidencia de publicación': Share2,
  'Reporte de conversión': TrendingUp,
  Encuesta: ClipboardList,
  'Fotografía de activación': Camera,
};

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface EvidenciaCardProps {
  evidencia: Evidencia;
  onSeleccionar: () => void;
}

export function EvidenciaCard({ evidencia, onSeleccionar }: EvidenciaCardProps) {
  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();

  const acuerdo = acuerdos.find((a) => a.id === evidencia.acuerdoId);
  const marca = acuerdo ? marcas.find((m) => m.id === acuerdo.marcaId) : undefined;
  const Icono = ICONOS_TIPO[evidencia.tipo];

  // Buscar primera imagen en los archivos
  const primeraImagen = evidencia.archivos?.find((a) => TIPOS_IMAGEN.includes(a.tipo));

  return (
    <button
      type="button"
      onClick={onSeleccionar}
      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex h-28 items-center justify-center overflow-hidden" style={{ backgroundColor: `${evidencia.colorPreview}1a` }}>
        {primeraImagen ? (
          <img
            src={`data:${primeraImagen.tipo};base64,${primeraImagen.datos}`}
            alt={primeraImagen.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icono size={28} style={{ color: evidencia.colorPreview }} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{evidencia.titulo}</h3>
          <Badge estado={evidencia.estado} />
        </div>
        {marca && <p className="text-xs text-gray-500">{marca.nombre}</p>}
        {acuerdo && <p className="text-xs text-gray-500">{acuerdo.nombre}</p>}
        {evidencia.responsableId && <p className="text-xs text-gray-600">Responsable: {evidencia.responsableId}</p>}
        <p className="line-clamp-2 text-xs text-gray-500">{evidencia.descripcion}</p>
        <p className="mt-auto pt-2 text-xs text-gray-400">
          {evidencia.tipo} · {formatFecha(evidencia.fechaEjecucion)}
        </p>
      </div>
    </button>
  );
}
