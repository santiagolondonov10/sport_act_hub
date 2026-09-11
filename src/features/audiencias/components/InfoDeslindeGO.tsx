import { Info } from 'lucide-react';

export function InfoDeslindeGO() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-info-500/20 bg-info-50 p-4">
      <Info size={18} className="mt-0.5 shrink-0 text-info-700" />
      <p className="text-sm text-info-700">
        Los datos personales y la gestión directa de las audiencias pertenecen a{' '}
        <strong>Sports Act GO</strong>. Business Hub utiliza únicamente información agregada para
        estructurar activos, medir activaciones y demostrar valor a los patrocinadores.
      </p>
    </div>
  );
}
