import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useMonthlyCumplimiento } from '@/hooks/useMonthlyCumplimiento';

interface TooltipPayloadItem {
  payload: { mes: string; cumplimiento: number };
}

function TooltipPersonalizado({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const { mes, cumplimiento } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-900">{mes}</p>
      <p className="text-gray-500">{cumplimiento}% de compromisos cumplidos</p>
    </div>
  );
}

export function CumplimientoChart() {
  const { data: datos } = useMonthlyCumplimiento();

  return (
    <Card>
      <CardHeader
        title="Cumplimiento mensual"
        description="Porcentaje de compromisos cumplidos por mes de vencimiento"
      />
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: '#e5e7eb' }} />
              <Line
                type="monotone"
                dataKey="cumplimiento"
                stroke="#0a4269"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0a4269' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
