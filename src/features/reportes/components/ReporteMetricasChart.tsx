import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumeroCompacto } from '@/lib/format';
import type { MetricaMensual } from '@/types';

export function ReporteMetricasChart({ datos }: { datos: MetricaMensual[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAlcance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0a4269" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0a4269" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorImpresiones" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a8d400" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#a8d400" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
          <YAxis
            tickFormatter={(v: number) => formatNumeroCompacto(v)}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip formatter={(valor: unknown) => formatNumeroCompacto(Number(valor))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="alcance" name="Alcance" stroke="#0a4269" fill="url(#colorAlcance)" strokeWidth={2} />
          <Area
            type="monotone"
            dataKey="impresiones"
            name="Impresiones"
            stroke="#a8d400"
            fill="url(#colorImpresiones)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
