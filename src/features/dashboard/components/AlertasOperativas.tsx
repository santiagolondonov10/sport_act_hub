import { TriangleAlert, CircleAlert, CircleCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useDashboardAlertas } from '@/hooks/useDashboardAlertas';

export function AlertasOperativas() {
  const { data: alertas } = useDashboardAlertas();

  return (
    <Card>
      <CardHeader title="Alertas operativas" description="Situaciones que requieren seguimiento" />
      <CardContent className="space-y-2.5">
        {alertas.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700">
            <CircleCheck size={16} />
            Todo en orden, sin alertas pendientes.
          </div>
        )}
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
              alerta.nivel === 'alta' ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700'
            }`}
          >
            {alerta.nivel === 'alta' ? (
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            ) : (
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{alerta.mensaje}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
