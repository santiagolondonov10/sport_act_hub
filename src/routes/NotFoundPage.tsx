import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-800/10 text-brand-800">
        <Compass size={26} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Página no encontrada</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        La ruta que buscas no existe o fue movida. Verifica el enlace o vuelve al dashboard principal.
      </p>
      <Link to="/" className="mt-5">
        <Button variante="primario">Volver al Dashboard</Button>
      </Link>
    </div>
  );
}
