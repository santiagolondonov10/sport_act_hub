import { TrendingUp, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import type { OportunidadInversion } from '../data';

interface OportunidadCardProps {
  oportunidad: OportunidadInversion;
  onVerDetalle: (oportunidad: OportunidadInversion) => void;
}

export function OportunidadCard({ oportunidad, onVerDetalle }: OportunidadCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-6 text-white">
        <div className="flex items-start justify-between">
          <div className="text-4xl">{oportunidad.logo}</div>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
            oportunidad.estado === 'Abierto' ? 'bg-green-100 text-green-800' :
            oportunidad.estado === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {oportunidad.estado}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-semibold">{oportunidad.nombre}</h3>
        <p className="mt-1 text-xs text-brand-100">{oportunidad.tipo}</p>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin size={14} />
            {oportunidad.ubicacion}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users size={14} />
            {oportunidad.invertidores} inversores
          </div>
        </div>

        <div className="mb-4 space-y-2 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Recaudación</span>
            <span className="font-semibold text-gray-900">{oportunidad.progresoRecaudacion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-700"
              style={{ width: `${oportunidad.progresoRecaudacion}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {formatCurrency(oportunidad.montoRecaudado / 1000000)}M de {formatCurrency(oportunidad.montoTotal / 1000000)}M
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">Retorno Esperado</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <TrendingUp size={14} />
              {oportunidad.retornoEsperado}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tiempo</p>
            <p className="text-sm font-semibold text-gray-900">{oportunidad.tiempoInversion} años</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <Button
          variante="primario"
          onClick={() => onVerDetalle(oportunidad)}
          className="w-full"
        >
          Ver Detalle
        </Button>
      </div>
    </div>
  );
}
