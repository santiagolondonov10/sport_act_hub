import { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Plus, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { getSessionUser } from '@/lib/auth';
import { loadConfiguration, request, type Configuration, type Sector } from '../lib/config';

export function SectoresPage() {
  const isAdmin = getSessionUser()?.subscriptionType === 'ADMIN';
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { loadConfiguration().then((data) => setSectores(data.sectores)).catch((value) => setError(value instanceof Error ? value.message : 'No fue posible cargar los sectores.')); }, []);
  if (!isAdmin) return <Navigate to="/" replace />;
  function editSector(sector: Sector) { setSelectedId(sector.id); setNombre(sector.nombre); setDescripcion(sector.descripcion); setMessage(''); }
  function reset() { setSelectedId(null); setNombre(''); setDescripcion(''); }
  async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); try { const path = selectedId ? `/api/admin/sectores/${selectedId}` : '/api/admin/sectores'; const data = await request<Configuration>(path, { method: selectedId ? 'PATCH' : 'POST', body: JSON.stringify({ nombre, descripcion }) }); setSectores(data.sectores); reset(); setMessage(selectedId ? 'Sector actualizado correctamente.' : 'Sector creado correctamente.'); } catch (value) { setError(value instanceof Error ? value.message : 'No fue posible guardar el sector.'); } finally { setSaving(false); } }
  async function remove(sector: Sector) { if (!window.confirm(`¿Eliminar el sector ${sector.nombre}?`)) return; setSaving(true); try { const data = await request<Configuration>(`/api/admin/sectores/${sector.id}`, { method: 'DELETE' }); setSectores(data.sectores); if (selectedId === sector.id) reset(); setMessage('Sector eliminado correctamente.'); } catch (value) { setError(value instanceof Error ? value.message : 'No fue posible eliminar el sector.'); } finally { setSaving(false); } }
  return <div className="space-y-6"><PageHeader titulo="Sectores" descripcion="Configura el catálogo utilizado para clasificar compañías." breadcrumbs={[{ label: 'Parametrización', to: '/parametrizacion' }, { label: 'Sectores' }]} accion={<Link to="/parametrizacion" className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:underline"><ArrowLeft size={16} /> Volver</Link>} />{message && <div className="rounded-lg border border-success-500/30 bg-success-50 px-4 py-3 text-sm text-success-700">{message}</div>}{error && <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>}<Card><CardHeader title={selectedId ? 'Editar sector' : 'Nuevo sector'} description="Administra las opciones disponibles para compañías." /><CardContent><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><TextField label="Nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} required /><TextField label="Descripción" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} /><div className="flex gap-2 sm:col-span-2"><Button type="submit" variante="primario" disabled={saving} icono={selectedId ? <Edit2 size={15} /> : <Plus size={15} />}>{selectedId ? 'Guardar cambios' : 'Crear sector'}</Button>{selectedId && <Button type="button" onClick={reset}>Cancelar</Button>}</div></form></CardContent></Card><Card><CardHeader title="Sectores disponibles" description={`${sectores.length} sectores registrados`} /><CardContent className="grid gap-2 md:grid-cols-2">{sectores.map((sector) => <div key={sector.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3"><div className="min-w-0 flex-1"><strong className="block text-sm text-gray-900">{sector.nombre}</strong><span className="text-xs text-gray-500">{sector.descripcion || 'Sin descripción'}</span></div><div className="flex gap-1"><Button type="button" tamano="sm" onClick={() => editSector(sector)} icono={<Edit2 size={14} />}>Editar</Button><Button type="button" tamano="sm" variante="peligro" onClick={() => remove(sector)} icono={<Trash2 size={14} />}>Eliminar</Button></div></div>)}</CardContent></Card></div>;
}
