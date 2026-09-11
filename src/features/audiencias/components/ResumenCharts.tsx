import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { canalesAudiencia, evolucionContactosPropios, segmentosAudiencia } from '@/data';
import { formatNumero, formatNumeroCompacto } from '@/lib/format';
import type { CampanaAudiencia } from '@/types';

const COLOR_SEGMENTOS = ['#0a4269', '#256f97', '#a8d400', '#d68a00', '#7c3aed'];

export function EvolucionContactosChart() {
  return (
    <Card>
      <CardHeader
        title="Evolución mensual de contactos propios"
        description="Base de email autorizada, único universo deduplicado de contactos propios"
      />
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolucionContactosPropios} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorContactos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a4269" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0a4269" stopOpacity={0} />
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
              <Tooltip formatter={(valor: unknown) => formatNumero(Number(valor))} labelFormatter={(mes) => `Mes: ${mes}`} />
              <Area type="monotone" dataKey="contactos" name="Contactos propios" stroke="#0a4269" fill="url(#colorContactos)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SeguidoresPorCanalChart() {
  const datos = canalesAudiencia.filter((c) => c.tipo === 'Social');

  return (
    <Card>
      <CardHeader
        title="Seguidores por canal social"
        description="Audiencia de plataformas externas — no equivale a contactos propios identificados"
      />
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => formatNumeroCompacto(v)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip formatter={(valor: unknown) => formatNumero(Number(valor))} />
              <Bar dataKey="tamanoAudiencia" name="Seguidores" fill="#a8d400" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DistribucionSegmentosChart() {
  const datos = segmentosAudiencia.map((s) => ({ nombre: s.nombre, tamano: s.tamano }));

  return (
    <Card>
      <CardHeader
        title="Distribución de contactos por segmento"
        description="Los segmentos pueden superponerse: la suma no equivale a personas únicas"
      />
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="tamano" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {datos.map((entry, index) => (
                  <Cell key={entry.nombre} fill={COLOR_SEGMENTOS[index % COLOR_SEGMENTOS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(valor: unknown) => formatNumero(Number(valor))} />
              <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComparacionCampanasChart({ campanas }: { campanas: CampanaAudiencia[] }) {
  const datos = campanas.map((c) => ({
    nombre: c.nombre,
    Alcance: c.alcance,
    Interacciones: c.interacciones,
    Conversiones: c.conversiones,
  }));

  return (
    <Card>
      <CardHeader
        title="Alcance, interacción y conversión por campaña"
        description="Resultados agregados de campañas con patrocinio activo o finalizado"
      />
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => formatNumeroCompacto(v)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip formatter={(valor: unknown) => formatNumero(Number(valor))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Alcance" fill="#0a4269" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Interacciones" fill="#a8d400" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Conversiones" fill="#d68a00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
