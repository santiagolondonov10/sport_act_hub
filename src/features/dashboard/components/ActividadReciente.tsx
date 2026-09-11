import { FolderCheck, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getActividadReciente } from '@/lib/selectors';
import { formatFecha } from '@/lib/format';

export function ActividadReciente() {
  const actividad = getActividadReciente(7);

  return (
    <Card>
      <CardHeader title="Actividad reciente" description="Últimos movimientos comerciales y de cumplimiento" />
      <CardContent>
        <ul className="space-y-4">
          {actividad.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  item.tipo === 'evidencia' ? 'bg-info-50 text-info-700' : 'bg-brand-800/10 text-brand-800'
                }`}
              >
                {item.tipo === 'evidencia' ? <FolderCheck size={14} /> : <MessageSquare size={14} />}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-800">{item.descripcion}</p>
                <p className="text-xs text-gray-400">
                  {item.autor} · {formatFecha(item.fecha)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
