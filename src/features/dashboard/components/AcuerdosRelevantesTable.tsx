import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { acuerdos, marcas } from '@/data';
import { formatFecha } from '@/lib/format';
import { formatCurrency } from '@/lib/formatters';
import { getCumplimientoPorAcuerdo } from '@/lib/selectors';

export function AcuerdosRelevantesTable() {
  const relevantes = acuerdos
    .filter((a) => a.estado === 'Activo' || a.estado === 'Próximo a vencer')
    .slice(0, 6);

  return (
    <Card>
      <CardHeader
        title="Acuerdos relevantes"
        description="Patrocinios activos y próximos a vencer"
        action={
          <Link to="/acuerdos" className="text-xs font-medium text-brand-800 hover:underline">
            Ver todos
          </Link>
        }
      />
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="pb-2 font-medium">Acuerdo</th>
              <th className="pb-2 font-medium">Marca</th>
              <th className="pb-2 font-medium">Valor</th>
              <th className="pb-2 font-medium">Vigencia</th>
              <th className="pb-2 font-medium">Cumplimiento</th>
              <th className="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {relevantes.map((acuerdo) => {
              const marca = marcas.find((m) => m.id === acuerdo.marcaId);
              const cumplimiento = getCumplimientoPorAcuerdo(acuerdo.id);
              return (
                <tr key={acuerdo.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-3">
                    <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-gray-900 hover:text-brand-800 hover:underline">
                      {acuerdo.nombre}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{marca?.nombre}</td>
                  <td className="py-2.5 pr-3 text-gray-600">{formatCurrency(acuerdo.valorCOP)}</td>
                  <td className="py-2.5 pr-3 text-gray-500">{formatFecha(acuerdo.fechaFin)}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar valor={cumplimiento} className="w-20" />
                      <span className="text-xs text-gray-500">{cumplimiento}%</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <Badge estado={acuerdo.estado} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
