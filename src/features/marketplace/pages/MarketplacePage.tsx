import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { oportunidadesInversion } from '../data';
import { OportunidadCard } from '../components/OportunidadCard';
import { OportunidadDetalleModal } from '../components/OportunidadDetalleModal';
import type { OportunidadInversion } from '../data';

export function MarketplacePage() {
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [oportunidadSeleccionada, setOportunidadSeleccionada] = useState<OportunidadInversion | null>(null);

  function handleVerDetalle(oportunidad: OportunidadInversion) {
    setOportunidadSeleccionada(oportunidad);
    setDetalleAbierto(true);
  }

  function handleCerrarDetalle() {
    setDetalleAbierto(false);
    setTimeout(() => setOportunidadSeleccionada(null), 300);
  }

  return (
    <div>
      <PageHeader
        titulo="Marketplace de Inversiones"
        descripcion="Explora oportunidades de inversión en propiedades y eventos deportivos"
        accion={
          <Button variante="primario" icono={<Plus size={16} />}>
            Crear Oferta
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Recaudado</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">$ 273 M</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Oportunidades Activas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{oportunidadesInversion.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Retorno Promedio</p>
          <p className="mt-1 flex items-center gap-1">
            <TrendingUp size={20} className="text-green-600" />
            <span className="text-2xl font-bold text-green-600">19.4%</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {oportunidadesInversion.map((oportunidad) => (
          <OportunidadCard
            key={oportunidad.id}
            oportunidad={oportunidad}
            onVerDetalle={handleVerDetalle}
          />
        ))}
      </div>

      <OportunidadDetalleModal
        abierto={detalleAbierto}
        oportunidad={oportunidadSeleccionada}
        onCerrar={handleCerrarDetalle}
      />
    </div>
  );
}
