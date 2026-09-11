import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getEstiloEstado } from '@/lib/statusStyles';
import { getCompromisosPorEstado } from '@/lib/selectors';

export function CompromisosPorEstado() {
  const datos = getCompromisosPorEstado();
  const total = datos.reduce((sum, d) => sum + d.cantidad, 0) || 1;

  return (
    <Card>
      <CardHeader title="Compromisos por estado" description="Distribución operativa actual" />
      <CardContent className="space-y-3">
        {datos.map((item) => {
          const estilo = getEstiloEstado(item.estado);
          const porcentaje = Math.round((item.cantidad / total) * 100);
          return (
            <div key={item.estado}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className={`h-2 w-2 rounded-full ${estilo.punto}`} aria-hidden="true" />
                  {item.estado}
                </span>
                <span className="font-medium text-gray-900">{item.cantidad}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${estilo.punto}`} style={{ width: `${porcentaje}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
