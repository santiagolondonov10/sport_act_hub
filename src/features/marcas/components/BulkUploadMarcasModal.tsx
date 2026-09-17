import { useState } from 'react';
import { Upload, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import * as XLSX from 'xlsx';
import { useMarcas } from '../store';

interface Marca {
  nombre: string;
  tipoIdentificacion: string;
  identificacion: string;
  sectorId?: string | null;
  personaContacto1?: string | null;
  telefonoContacto1?: string | null;
  correoContacto1?: string | null;
  cargoContacto1?: string | null;
  personaContacto2?: string | null;
  telefonoContacto2?: string | null;
  correoContacto2?: string | null;
  cargoContacto2?: string | null;
  personaContacto3?: string | null;
  telefonoContacto3?: string | null;
  correoContacto3?: string | null;
  cargoContacto3?: string | null;
  contactarPorWhatsapp?: boolean;
  contactarPorCorreo?: boolean;
}

interface MarcaConIndice extends Marca {
  _indice: number;
}

interface BulkUploadMarcasModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

interface ModalFormatoProps {
  abierto: boolean;
  onSeleccionar: (formato: 'csv' | 'xlsx') => void;
  onCerrar: () => void;
}

const COLUMNAS_PLANTILLA = [
  'Nombre',
  'Tipo de Identificación',
  'Identificación',
  'Sector ID',
  'Contacto 1',
  'Cargo Contacto 1',
  'Teléfono Contacto 1',
  'Correo Contacto 1',
  'Contacto 2',
  'Cargo Contacto 2',
  'Teléfono Contacto 2',
  'Correo Contacto 2',
  'Contacto 3',
  'Cargo Contacto 3',
  'Teléfono Contacto 3',
  'Correo Contacto 3',
  'WhatsApp',
  'Correo',
];

const MAPEO_COLUMNAS: Record<string, keyof Marca> = {
  'Nombre': 'nombre',
  'Tipo de Identificación': 'tipoIdentificacion',
  'Identificación': 'identificacion',
  'Sector ID': 'sectorId',
  'Contacto 1': 'personaContacto1',
  'Cargo Contacto 1': 'cargoContacto1',
  'Teléfono Contacto 1': 'telefonoContacto1',
  'Correo Contacto 1': 'correoContacto1',
  'Contacto 2': 'personaContacto2',
  'Cargo Contacto 2': 'cargoContacto2',
  'Teléfono Contacto 2': 'telefonoContacto2',
  'Correo Contacto 2': 'correoContacto2',
  'Contacto 3': 'personaContacto3',
  'Cargo Contacto 3': 'cargoContacto3',
  'Teléfono Contacto 3': 'telefonoContacto3',
  'Correo Contacto 3': 'correoContacto3',
  'WhatsApp': 'contactarPorWhatsapp',
  'Correo': 'contactarPorCorreo',
};

function ModalFormatoDescarga({ abierto, onSeleccionar, onCerrar }: ModalFormatoProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Selecciona el formato</h3>
          <p className="mt-1 text-sm text-gray-600">¿En qué formato deseas descargar la plantilla?</p>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={() => onSeleccionar('xlsx')}
            className="w-full flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
              <span className="text-lg font-bold text-green-700">XL</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Formato Excel</p>
              <p className="text-xs text-gray-600">Archivo .xlsx para compatibilidad máxima</p>
            </div>
          </button>
          <button
            onClick={() => onSeleccionar('csv')}
            className="w-full flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <span className="text-lg font-bold text-blue-700">CSV</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Formato CSV</p>
              <p className="text-xs text-gray-600">Archivo .csv compatible con cualquier hoja de cálculo</p>
            </div>
          </button>
        </div>
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onCerrar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function descargarPlantilla(formato: 'csv' | 'xlsx') {
  const ejemploMarca = [
    'Coca-Cola',
    'NIT',
    '891234567-2',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Juan García',
    'Gerente Comercial',
    '+57 1 2345678',
    'juan.garcia@cocacola.com',
    'María López',
    'Ejecutiva Cuentas',
    '+57 1 2345679',
    'maria.lopez@cocacola.com',
    '',
    '',
    '',
    '',
    'Sí',
    'Sí',
  ];

  const datos = [COLUMNAS_PLANTILLA, ejemploMarca];

  if (formato === 'csv') {
    const csv = datos.map(fila => fila.map(celda => `"${celda}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'plantilla_marcas.csv';
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const ws = XLSX.utils.aoa_to_sheet(datos);
    ws['!cols'] = COLUMNAS_PLANTILLA.map(() => ({ wch: 22 }));
    // Estilo para fila de encabezado
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '374151' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
    for (let i = 0; i < COLUMNAS_PLANTILLA.length; i++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) cell.s = headerStyle;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marcas');
    XLSX.writeFile(wb, 'plantilla_marcas.xlsx');
  }
}

function procesarArchivo(archivo: File): Promise<MarcaConIndice[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contenido = e.target?.result as ArrayBuffer | string;
        const wb = XLSX.read(contenido, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(ws, { header: 0 });

        const marcas: MarcaConIndice[] = (datos as any[]).map((fila, indice) => {
          const marca: MarcaConIndice = { _indice: indice + 2 } as MarcaConIndice;

          Object.entries(MAPEO_COLUMNAS).forEach(([encabezado, campo]) => {
            const valor = fila[encabezado];
            if (valor !== undefined && valor !== null && valor !== '') {
              if (campo === 'contactarPorWhatsapp' || campo === 'contactarPorCorreo') {
                marca[campo] = valor === true || valor === 'Sí' || valor === 'si' || valor === '1' || valor === 1;
              } else {
                marca[campo] = String(valor).trim();
              }
            }
          });

          return marca;
        });

        resolve(marcas);
      } catch (error) {
        reject(new Error('Error al procesar el archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(archivo);
  });
}

export function BulkUploadMarcasModal({ abierto, onCerrar }: BulkUploadMarcasModalProps) {
  const { crearMarca } = useMarcas();
  const { mostrarToast } = useToast();
  const [paso, setPaso] = useState<'opciones' | 'subida' | 'preview'>('opciones');
  const [marcas, setMarcas] = useState<MarcaConIndice[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<number, string[]>>({});
  const [modalFormatoAbierto, setModalFormatoAbierto] = useState(false);

  const handleDescargarPlantilla = () => {
    setModalFormatoAbierto(true);
  };

  const handleSeleccionarFormato = (formato: 'csv' | 'xlsx') => {
    descargarPlantilla(formato);
    setModalFormatoAbierto(false);
  };

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!['.csv', '.xls', '.xlsx'].some(ext => archivo.name.toLowerCase().endsWith(ext))) {
      mostrarToast('El archivo debe ser CSV o Excel');
      return;
    }

    setCargando(true);
    try {
      const marcasProcessadas = await procesarArchivo(archivo);

      // Validar marcas
      const erroresValidacion: Record<number, string[]> = {};
      marcasProcessadas.forEach((marca) => {
        const errores: string[] = [];
        if (!marca.nombre?.trim()) errores.push('Nombre es requerido');
        if (!marca.tipoIdentificacion?.trim()) errores.push('Tipo de identificación es requerido');
        if (!marca.identificacion?.trim()) errores.push('Identificación es requerida');
        if (errores.length > 0) {
          erroresValidacion[marca._indice] = errores;
        }
      });

      setErrores(erroresValidacion);
      setMarcas(marcasProcessadas);
      setPaso('preview');
    } catch (error) {
      mostrarToast('Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };

  const handleCargar = async () => {
    const marcasValidas = marcas.filter(m => !errores[m._indice]);

    if (marcasValidas.length === 0) {
      mostrarToast('No hay marcas válidas para cargar');
      return;
    }

    setCargando(true);
    let cargadas = 0;
    let fallidas = 0;
    const erroresList: string[] = [];

    for (const marca of marcasValidas) {
      try {
        const { _indice, ...datosParaCrear } = marca;

        // Asegurar que los campos obligatorios están presentes
        if (!datosParaCrear.nombre || !datosParaCrear.tipoIdentificacion || !datosParaCrear.identificacion) {
          fallidas++;
          erroresList.push(`Fila ${_indice}: Faltan campos obligatorios`);
          continue;
        }

        await crearMarca(datosParaCrear);
        cargadas++;
      } catch (error) {
        fallidas++;
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        erroresList.push(`Fila ${marca._indice}: ${mensaje}`);
        console.error(`Error cargando marca fila ${marca._indice}:`, error);
      }
    }

    setCargando(false);

    if (fallidas > 0 && erroresList.length > 0) {
      mostrarToast(`⚠️ ${cargadas} marcas cargadas. ${fallidas} errores: ${erroresList.slice(0, 2).join('; ')}`);
    } else {
      mostrarToast(`✓ ${cargadas} marcas cargadas correctamente`);
    }

    if (fallidas === 0) {
      handleCerrar();
    }
  };

  const handleCerrar = () => {
    setPaso('opciones');
    setMarcas([]);
    setErrores({});
    onCerrar();
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Carga masiva de marcas</h2>
          <button onClick={handleCerrar} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {paso === 'opciones' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Carga múltiples marcas a través de un archivo Excel o CSV. Primero descarga la plantilla, complétala y luego sube el archivo.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleDescargarPlantilla}
                  className="flex items-center justify-center gap-2 rounded-lg border border-brand-600 px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Download size={18} />
                  Descargar plantilla
                </button>
                <label className="flex items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-100 transition-colors cursor-pointer">
                  <Upload size={18} />
                  Subir archivo
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleArchivoSeleccionado}
                    className="hidden"
                    disabled={cargando}
                  />
                </label>
              </div>
            </div>
          )}

          {paso === 'preview' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Total de registros: <span className="text-brand-600">{marcas.length}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Object.keys(errores).length > 0 && `${Object.keys(errores).length} con errores`}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 w-8">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Identificación</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 w-12">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marcas.map((marca) => {
                      const tieneErrores = errores[marca._indice];
                      return (
                        <tr key={marca._indice} className={tieneErrores ? 'bg-red-50 border-b border-gray-100' : 'border-b border-gray-100 hover:bg-gray-50'}>
                          <td className="px-4 py-2 text-gray-500">{marca._indice}</td>
                          <td className="px-4 py-2">
                            <div>
                              <p className="text-gray-900 font-medium">{marca.nombre || '-'}</p>
                              {tieneErrores && (
                                <ul className="mt-1 space-y-0.5 text-xs text-red-600">
                                  {tieneErrores.map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {marca.tipoIdentificacion}: {marca.identificacion || '-'}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              tieneErrores
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {tieneErrores ? '✕' : '✓'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-2 justify-end">
          {paso === 'opciones' && (
            <Button variante="secundario" onClick={handleCerrar}>
              Cancelar
            </Button>
          )}
          {paso === 'preview' && (
            <>
              <Button variante="secundario" onClick={() => setPaso('opciones')}>
                Volver
              </Button>
              <Button
                variante="primario"
                onClick={handleCargar}
                disabled={cargando || marcas.length === 0}
              >
                {cargando ? 'Cargando...' : `Cargar ${marcas.filter(m => !errores[m._indice]).length} marcas`}
              </Button>
            </>
          )}
        </div>
      </div>

      <ModalFormatoDescarga
        abierto={modalFormatoAbierto}
        onSeleccionar={handleSeleccionarFormato}
        onCerrar={() => setModalFormatoAbierto(false)}
      />
    </div>
  );
}
