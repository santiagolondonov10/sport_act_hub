import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { usePipelineData } from '@/hooks/usePipelineData';
import { formatCOP, formatNumero } from '@/lib/format';

const COLOR_ETAPA: Record<string, string> = {
  Prospección: '#9ca3af',
  Contactado: '#2563eb',
  Propuesta: '#d68a00',
  Negociación: '#0a4269',
  Firmada: '#12a150',
  Perdida: '#dc2626',
};

interface TooltipPayloadItem {
  payload: { etapa: string; cantidad: number; valorCOP: number };
}

function TooltipPersonalizado({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const { etapa, cantidad, valorCOP } = payload[0].payload;
  const valorNumerico = Number(valorCOP) || 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-900">{etapa}</p>
      <p className="text-gray-500">{cantidad} oportunidad(es)</p>
      <p className="font-medium text-gray-700">{formatCOP(isNaN(valorNumerico) ? 0 : valorNumerico)}</p>
    </div>
  );
}

export function PipelineChart() {
  const { data: datos } = usePipelineData();
  const totalOportunidades = datos.reduce((total, d) => total + d.cantidad, 0);

  return (
    <Card>
      <CardHeader
        title="Pipeline por etapa"
        description={`${formatNumero(totalOportunidades)} oportunidades en seguimiento`}
      />
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
              <XAxis
                dataKey="etapa"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickFormatter={(valor: number) => formatCOP(valor)}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="valorCOP" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {datos.map((entry) => (
                  <Cell key={entry.etapa} fill={COLOR_ETAPA[entry.etapa]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
