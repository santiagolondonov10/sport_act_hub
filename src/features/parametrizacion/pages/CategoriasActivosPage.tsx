import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { authHeaders } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { CategoriasModalForm } from '../components/CategoriasModalForm';

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
}


export function CategoriasActivosPage() {
  const { mostrarToast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/activo-categorias`, { headers });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      mostrarToast('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = () => {
    setCategoriaEditando(null);
    setModalAbierto(true);
  };

  const handleEditar = (categoria: Categoria) => {
    setCategoriaEditando(categoria);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/activo-categorias/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setCategorias((prev) => prev.filter((c) => c.id !== id));
        mostrarToast('Categoría eliminada correctamente');
      } else {
        mostrarToast('Error al eliminar la categoría');
      }
    } catch (error) {
      mostrarToast('Error al eliminar la categoría');
    }
  };

  const handleGuardar = async (nombre: string, descripcion: string) => {
    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });

      if (categoriaEditando) {
        // Actualizar
        const response = await fetch(`/api/activo-categorias/${categoriaEditando.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ nombre, descripcion }),
        });

        if (response.ok) {
          const updated = await response.json();
          setCategorias((prev) => prev.map((c) => (c.id === categoriaEditando.id ? updated : c)));
          mostrarToast('Categoría actualizada correctamente');
        } else {
          mostrarToast('Error al actualizar la categoría');
        }
      } else {
        // Crear
        const response = await fetch(`/api/activo-categorias`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ nombre, descripcion }),
        });

        if (response.ok) {
          const nueva = await response.json();
          setCategorias((prev) => [nueva, ...prev]);
          mostrarToast('Categoría creada correctamente');
        } else if (response.status === 409) {
          mostrarToast('Esta categoría ya existe');
        } else {
          mostrarToast('Error al crear la categoría');
        }
      }
      setModalAbierto(false);
    } catch (error) {
      mostrarToast('Error al guardar la categoría');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          titulo="Categorías de Activos"
          descripcion="Administra los tipos de activos comerciales disponibles."
          etiqueta="Parametrización"
        />
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Categorías de Activos"
        descripcion="Administra los tipos de activos comerciales disponibles."
        etiqueta="Parametrización"
        accion={
          <Button variante="primario" icono={<Plus size={16} />} onClick={handleCrear}>
            Nueva Categoría
          </Button>
        }
      />

      {categorias.length === 0 ? (
        <EmptyState
          icono={Package}
          titulo="Sin categorías de activos"
          descripcion="Crea la primera categoría para clasificar tus activos comerciales."
          accion={
            <Button variante="primario" icono={<Plus size={16} />} onClick={handleCrear}>
              Crear Categoría
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{categoria.nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{categoria.descripcion || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        categoria.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {categoria.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(categoria)}
                        className="text-gray-600 hover:text-brand-800 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(categoria.id)}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoriasModalForm
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={handleGuardar}
        categoria={categoriaEditando}
      />
    </div>
  );
}
