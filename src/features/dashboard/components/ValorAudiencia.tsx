import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, UsersRound } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { canalesAudiencia, campanasAudiencia, segmentosAudiencia } from '@/data';
import { formatNumero, formatNumeroCompacto, formatPorcentaje } from '@/lib/format';

export function ValorAudiencia() {
  const canalEmail = canalesAudiencia.find((c) => c.id === 'canal-email');
  const contactosPropios = canalEmail?.tamanoAudiencia ?? 0;
  const segmentosPropios = segmentosAudiencia.filter((s) => s.tipoDato === 'Propia');
  const crecimientoPromedio = segmentosPropios.length
    ? segmentosPropios.reduce((s, seg) => s + seg.crecimiento, 0) / segmentosPropios.length
    : 0;
  const segmentosActivables = segmentosAudiencia.filter((s) => s.estado === 'Activable').length;
  const alcancePeriodo = canalesAudiencia.reduce((s, c) => s + c.alcancePeriodo, 0);
  const campanasConPatrocinio = campanasAudiencia.filter((c) => c.patrocinadorId).length;

  return (
    <Card>
      <CardHeader
        title="Valor de audiencia"
        description="Resumen del ecosistema digital construido en Sports Act GO"
        action={
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800/10 text-brand-800">
            <UsersRound size={16} />
          </span>
        }
      />
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Contactos propios autorizados</p>
            <p className="text-lg font-semibold text-gray-900">{formatNumero(contactosPropios)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Crecimiento de la base</p>
            <p className="text-lg font-semibold text-success-700">+{formatPorcentaje(crecimientoPromedio, 1)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Segmentos activables</p>
            <p className="text-lg font-semibold text-gray-900">{formatNumero(segmentosActivables)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Alcance del periodo</p>
            <p className="text-lg font-semibold text-gray-900">{formatNumeroCompacto(alcancePeriodo)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-100 px-3 py-2.5 text-xs text-brand-800">
          <Lightbulb size={14} className="mt-0.5 shrink-0" />
          <span>
            La organización tiene {segmentosActivables} segmentos activables con información actualizada y{' '}
            {campanasConPatrocinio} campaña(s) con resultados de patrocinio. Vincúlalos con los activos digitales
            para fortalecer las próximas propuestas comerciales.
          </span>
        </div>

        <Link
          to="/audiencias"
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
        >
          Ver audiencias y alcance <ArrowRight size={14} />
        </Link>
      </CardContent>
    </Card>
  );
}
