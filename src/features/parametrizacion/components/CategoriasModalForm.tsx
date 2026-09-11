import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField } from '@/components/ui/Field';

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
}

interface CategoriasModalFormProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (nombre: string, descripcion: string) => void;
  categoria?: Categoria | null;
}

export function CategoriasModalForm({ abierto, onCerrar, onGuardar, categoria }: CategoriasModalFormProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (abierto) {
      if (categoria) {
        setNombre(categoria.nombre);
        setDescripcion(categoria.descripcion || '');
      } else {
        setNombre('');
        setDescripcion('');
      }
      setError('');
    }
  }, [abierto, categoria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    onGuardar(nombre.trim(), descripcion.trim());
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={categoria ? 'Editar categoría' : 'Nueva categoría'}
      descripcion={
        categoria
          ? 'Actualiza la información de la categoría de activos.'
          : 'Crea una nueva categoría para clasificar activos comerciales.'
      }
      ancho="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nombre de la categoría"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Camiseta y uniforme"
          required
        />
        <TextAreaField
          label="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe qué incluye esta categoría de activos"
          rows={3}
        />
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario">
            {categoria ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
