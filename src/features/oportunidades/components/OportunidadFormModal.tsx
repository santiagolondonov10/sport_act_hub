import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/Field';
import { ETAPAS_OPORTUNIDAD } from '@/types';
import type { Oportunidad } from '@/types';
import { authHeaders, getSessionUser } from '@/lib/auth';
import { formatNumber } from '@/lib/formatters';

interface Marca {
  id: string;
  nombre: string;
  personaContacto1?: string;
  telefonoContacto1?: string;
  correoContacto1?: string;
  cargoContacto1?: string;
  personaContacto2?: string;
  telefonoContacto2?: string;
  correoContacto2?: string;
  cargoContacto2?: string;
  personaContacto3?: string;
  telefonoContacto3?: string;
  correoContacto3?: string;
  cargoContacto3?: string;
}

interface OportunidadFormModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (valores: Omit<Oportunidad, 'id' | 'fechaCreacion' | 'actividad'>) => void;
  oportunidadInicial?: Oportunidad;
}

function formatDateForInput(fecha: string | undefined): string {
  if (!fecha) return '';
  // Si viene en formato ISO (con T), extrae solo la fecha YYYY-MM-DD
  if (fecha.includes('T')) {
    return fecha.split('T')[0];
  }
  return fecha;
}

export function OportunidadFormModal({ abierto, onCerrar, onGuardar, oportunidadInicial }: OportunidadFormModalProps) {
  const esEdicion = Boolean(oportunidadInicial);

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaId, setMarcaId] = useState(oportunidadInicial?.marcaId ?? '');
  const [responsableId, setResponsableId] = useState<string>(oportunidadInicial?.responsableId ?? '');
  const [contactosDisponibles, setContactosDisponibles] = useState<Array<{ id: string; nombre: string; telefono?: string; correo?: string }>>([]);
  const [etapa, setEtapa] = useState(oportunidadInicial?.etapa ?? ETAPAS_OPORTUNIDAD[0]);
  const [valorEstimadoCOP, setValorEstimadoCOP] = useState(String(oportunidadInicial?.valorEstimadoCOP ?? ''));
  const [fechaEstimadaCierre, setFechaEstimadaCierre] = useState(formatDateForInput(oportunidadInicial?.fechaEstimadaCierre));
  const [proximoPaso, setProximoPaso] = useState(oportunidadInicial?.proximoPaso ?? '');
  const [probabilidad] = useState(oportunidadInicial?.probabilidad ?? 50);
  const [responsableInternoNombre, setResponsableInternoNombre] = useState(oportunidadInicial?.responsableInternoNombre ?? '');
  const [responsableInternoCorreo, setResponsableInternoCorreo] = useState(oportunidadInicial?.responsableInternoCorreo ?? '');
  const [responsableInternoTelefono, setResponsableInternoTelefono] = useState(oportunidadInicial?.responsableInternoTelefono ?? '');
  const [activosSeleccionados, setActivosSeleccionados] = useState<string[]>(
    oportunidadInicial?.activosPropuestosIds ?? [],
  );
  const [activosMarca, setActivosMarca] = useState<Array<{ id: string; nombre: string }>>([]);
  const [companiaNombre, setCompaniaNombre] = useState('');

  // Cargar nombre de compañía al montar el componente
  useEffect(() => {
    const cargarCompania = async () => {
      try {
        const sessionUser = getSessionUser();
        if (sessionUser?.companiaId) {
          const headers = new Headers();
          const auth = authHeaders();
          Object.entries(auth).forEach(([key, value]) => {
            if (value) headers.set(key, value);
          });
          const response = await fetch(`/api/admin/companias/${sessionUser.companiaId}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setCompaniaNombre(data.nombre || '');
          }
        }
      } catch (error) {
        console.error('Error loading company:', error);
      }
    };
    cargarCompania();
  }, []);

  // Cargar marcas y activos cuando se abre el modal
  useEffect(() => {
    if (abierto) {
      const cargarDatos = async () => {
        try {
          const headers = new Headers();
          const auth = authHeaders();
          Object.entries(auth).forEach(([key, value]) => {
            if (value) headers.set(key, value);
          });

          // Cargar marcas
          const responseMarcas = await fetch(`/api/marcas`, { headers });
          if (responseMarcas.ok) {
            const marcasData = await responseMarcas.json();
            setMarcas(marcasData);
            if (!marcaId && marcasData.length > 0) {
              setMarcaId(marcasData[0].id);
            }
          }

          // Cargar activos
          const responseActivos = await fetch(`/api/activos`, { headers });
          if (responseActivos.ok) {
            const activosData = await responseActivos.json();
            setActivosMarca(activosData);
          }
        } catch (error) {
          console.error('Error loading datos:', error);
        }
      };

      cargarDatos();
    }
  }, [abierto]);

  // Cargar contactos cuando cambia la marca seleccionada
  useEffect(() => {
    if (marcaId && marcas.length > 0) {
      const marca = marcas.find((m) => m.id === marcaId);
      if (marca) {
        const contactos: Array<{ id: string; nombre: string; cargo?: string; telefono?: string; correo?: string }> = [];

        if (marca.personaContacto1) {
          const nombre = marca.cargoContacto1
            ? `${marca.personaContacto1} (${marca.cargoContacto1})`
            : marca.personaContacto1;
          contactos.push({
            id: `${marca.id}-contacto1`,
            nombre,
            cargo: marca.cargoContacto1,
            telefono: marca.telefonoContacto1,
            correo: marca.correoContacto1,
          });
        }
        if (marca.personaContacto2) {
          const nombre = marca.cargoContacto2
            ? `${marca.personaContacto2} (${marca.cargoContacto2})`
            : marca.personaContacto2;
          contactos.push({
            id: `${marca.id}-contacto2`,
            nombre,
            cargo: marca.cargoContacto2,
            telefono: marca.telefonoContacto2,
            correo: marca.correoContacto2,
          });
        }
        if (marca.personaContacto3) {
          const nombre = marca.cargoContacto3
            ? `${marca.personaContacto3} (${marca.cargoContacto3})`
            : marca.personaContacto3;
          contactos.push({
            id: `${marca.id}-contacto3`,
            nombre,
            cargo: marca.cargoContacto3,
            telefono: marca.telefonoContacto3,
            correo: marca.correoContacto3,
          });
        }

        setContactosDisponibles(contactos);
        if (!responsableId && contactos.length > 0) {
          setResponsableId(contactos[0].id);
        }
      }
    }
  }, [marcaId, marcas]);

  function alternarActivo(id: string) {
    setActivosSeleccionados((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Validaciones
    if (!marcaId) {
      alert('Por favor selecciona una marca');
      return;
    }
    if (!responsableId) {
      alert('Por favor selecciona un responsable/contacto');
      return;
    }
    if (!etapa) {
      alert('Por favor selecciona una etapa');
      return;
    }
    if (!valorEstimadoCOP || Number(valorEstimadoCOP) <= 0) {
      alert('Por favor ingresa un valor estimado válido');
      return;
    }
    if (!fechaEstimadaCierre) {
      alert('Por favor selecciona una fecha estimada de cierre');
      return;
    }
    if (!proximoPaso || !proximoPaso.trim()) {
      alert('Por favor describe el próximo paso');
      return;
    }
    if (!responsableInternoNombre || !responsableInternoNombre.trim()) {
      alert('Por favor ingresa el nombre del responsable interno');
      return;
    }
    if (!responsableInternoCorreo || !responsableInternoCorreo.trim()) {
      alert('Por favor ingresa el correo del responsable interno');
      return;
    }
    if (!responsableInternoTelefono || !responsableInternoTelefono.trim()) {
      alert('Por favor ingresa el teléfono del responsable interno');
      return;
    }

    onGuardar({
      marcaId,
      responsableId,
      etapa,
      valorEstimadoCOP: Number(valorEstimadoCOP) || 0,
      fechaEstimadaCierre,
      activosPropuestosIds: activosSeleccionados,
      proximoPaso,
      probabilidad,
      responsableInternoNombre,
      responsableInternoCorreo,
      responsableInternoTelefono,
    });
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={esEdicion ? 'Editar oportunidad' : 'Nueva oportunidad'}
      descripcion="Registra los datos clave de la negociación comercial."
      ancho="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Marca"
            value={marcaId}
            onChange={(e) => setMarcaId(e.target.value)}
            options={marcas.map((m) => ({ value: m.id, label: m.nombre }))}
            required
          />
          <SelectField
            label="Responsable de la marca (Contacto)"
            value={responsableId}
            onChange={(e) => setResponsableId(e.target.value)}
            options={contactosDisponibles.map((c) => ({
              value: c.id,
              label: c.nombre,
            }))}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectField
            label="Etapa"
            value={etapa}
            onChange={(e) => setEtapa(e.target.value as typeof etapa)}
            options={ETAPAS_OPORTUNIDAD.map((e) => ({ value: e, label: e }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor estimado (COP)</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-600">$</span>
              <input
                type="text"
                min={0}
                value={valorEstimadoCOP ? formatNumber(Number(valorEstimadoCOP)) : ''}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\./g, '');
                  setValorEstimadoCOP(valor);
                }}
                placeholder="0"
                className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>
        <TextField
          label="Fecha estimada de cierre"
          type="date"
          value={fechaEstimadaCierre}
          onChange={(e) => setFechaEstimadaCierre(e.target.value)}
          required
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Activos propuestos</p>
          {activosMarca.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              No hay activos disponibles para esta marca. Selecciona otra marca o crea activos en la sección de Activos.
            </div>
          ) : (
            <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 sm:grid-cols-2">
              {activosMarca.map((activo) => (
                <label key={activo.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={activosSeleccionados.includes(activo.id)}
                    onChange={() => alternarActivo(activo.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                  />
                  {activo.nombre}
                </label>
              ))}
            </div>
          )}
        </div>
        <TextAreaField
          label="Próximo paso"
          value={proximoPaso}
          onChange={(e) => setProximoPaso(e.target.value)}
          rows={2}
          required
        />
        <div className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Responsable Interno {companiaNombre && `(${companiaNombre})`}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField
              label="Nombre"
              value={responsableInternoNombre}
              onChange={(e) => setResponsableInternoNombre(e.target.value)}
              required
            />
            <TextField
              label="Correo"
              type="email"
              value={responsableInternoCorreo}
              onChange={(e) => setResponsableInternoCorreo(e.target.value)}
              required
            />
            <TextField
              label="Teléfono"
              value={responsableInternoTelefono}
              onChange={(e) => setResponsableInternoTelefono(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario">
            {esEdicion ? 'Guardar cambios' : 'Crear oportunidad'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
