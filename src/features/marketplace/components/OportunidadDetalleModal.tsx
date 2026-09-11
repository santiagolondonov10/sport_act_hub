import { X, MapPin, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { OportunidadInversion } from '../data';

interface OportunidadDetalleModalProps {
  abierto: boolean;
  oportunidad: OportunidadInversion | null;
  onCerrar: () => void;
}

export function OportunidadDetalleModal({ abierto, oportunidad, onCerrar }: OportunidadDetalleModalProps) {
  if (!abierto || !oportunidad) return null;

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case 'Bajo':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'Medio':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Alto':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{oportunidad.logo}</span>
            <div>
              <h2 className="text-xl font-bold">{oportunidad.nombre}</h2>
              <p className="text-sm text-brand-100">{oportunidad.tipo}</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-2 hover:bg-brand-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Descripción */}
          <div>
            <p className="text-gray-700">{oportunidad.descripcionDetallada}</p>
          </div>

          {/* Información de ubicación y tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm">Ubicación</span>
              </div>
              <p className="mt-1 font-semibold text-gray-900">{oportunidad.ubicacion}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <AlertCircle size={16} />
                <span className="text-sm">Riesgo</span>
              </div>
              <p className={`mt-1 inline-block rounded-full px-2 py-1 text-sm font-semibold ${getRiesgoColor(oportunidad.riesgo)}`}>
                {oportunidad.riesgo}
              </p>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Retorno Esperado</p>
              <p className="mt-2 flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                <TrendingUp size={20} />
                {oportunidad.retornoEsperado}%
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Tiempo de Inversión</p>
              <p className="mt-2 flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Clock size={20} />
                {oportunidad.tiempoInversion}a
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Inversores</p>
              <p className="mt-2 flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Users size={20} />
                {oportunidad.invertidores}
              </p>
            </div>
          </div>

          {/* Detalles de recaudación */}
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div className="mb-3 flex justify-between">
              <p className="font-semibold text-gray-900">Progreso de Recaudación</p>
              <p className="text-sm font-bold text-blue-600">{oportunidad.progresoRecaudacion}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                style={{ width: `${oportunidad.progresoRecaudacion}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Recaudado</p>
                <p className="font-semibold text-gray-900">$ {(oportunidad.montoRecaudado / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-gray-600">Meta Total</p>
                <p className="font-semibold text-gray-900">$ {(oportunidad.montoTotal / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            <div className="mt-3 border-t border-blue-200 pt-3">
              <p className="text-xs text-gray-600">Monto Mínimo de Inversión</p>
              <p className="font-bold text-gray-900">$ {(oportunidad.montoMinimo / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 border-t border-gray-200 pt-6">
            <Button
              variante="secundario"
              onClick={onCerrar}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              variante="primario"
              className="flex-1"
            >
              Crear Oferta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
