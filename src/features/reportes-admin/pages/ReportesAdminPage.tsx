import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Building2, CreditCard, FileText, Search, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { getSessionUser, authHeaders } from '@/lib/auth';

interface ReportData { subscriptions: Record<string, unknown>[]; companias: Record<string, unknown>[]; usuarios: Record<string, unknown>[] }
const reports = [
  { key: 'subscriptions', title: 'Reporte de suscripciones', description: 'Planes configurados y su estado.', icon: CreditCard, tone: 'bg-accent-100 text-brand-800' },
  { key: 'companias', title: 'Reporte de Compañías', description: 'Compañías y datos de contacto registrados.', icon: Building2, tone: 'bg-info-50 text-info-700' },
  { key: 'usuarios', title: 'Reporte de Usuarios', description: 'Usuarios, suscripciones, compañías y vigencias.', icon: Users, tone: 'bg-success-50 text-success-700' },
] as const;
const labels: Record<string, string> = { code: 'Código', name: 'Nombre', description: 'Descripción', priceCop: 'Precio COP', maxUsers: 'Máximo usuarios', isActive: 'Activo', nombre: 'Nombre', sector: 'Sector', contactName: 'Contacto', phone: 'Teléfono', email: 'Correo', username: 'Usuario', subscriptionType: 'Suscripción', companiaNombre: 'Compañía', validFrom: 'Valid from', validUntil: 'Valid until', createdAt: 'Created at', updatedAt: 'Updated at', lastLoginAt: 'Last login at' };

export function ReportesAdminPage() {
  const isAdmin = getSessionUser()?.subscriptionType === 'ADMIN';
  const [data, setData] = useState<ReportData | null>(null);
  const [selected, setSelected] = useState<(typeof reports)[number]['key']>('subscriptions');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [ascending, setAscending] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { const headers = new Headers(); Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value)); fetch(`/api/admin/reports`, { headers }).then(async (response) => { const payload = await response.json() as ReportData & { error?: string }; if (!response.ok) throw new Error(payload.error); setData(payload); }).catch((value) => setError(value instanceof Error ? value.message : 'No fue posible cargar los reportes.')); }, []);
  if (!isAdmin) return <Navigate to="/" replace />;
  const rows = data?.[selected] ?? [];
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const filteredRows = useMemo(() => rows.filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search.toLowerCase()))).sort((a, b) => { if (!sortKey) return 0; const first = String(a[sortKey] ?? ''); const second = String(b[sortKey] ?? ''); return (first.localeCompare(second, undefined, { numeric: true }) || 0) * (ascending ? 1 : -1); }), [rows, search, sortKey, ascending]);
  function sortBy(key: string) { if (key === sortKey) setAscending((value) => !value); else { setSortKey(key); setAscending(true); } }

  return <div className="space-y-6"><PageHeader titulo="Reportes Admin" descripcion="Consulta y organiza la información administrativa de la plataforma." etiqueta="Administración" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{reports.map(({ key, title, description, icon: Icon, tone }) => <button key={key} type="button" onClick={() => { setSelected(key); setSearch(''); setSortKey(''); }} className={`flex min-h-20 items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${selected === key ? 'border-brand-700 bg-brand-800/5' : 'border-gray-200 bg-white hover:border-brand-400'}`}><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon size={16} /></div><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-gray-900">{title}</h2><p className="mt-1 truncate text-xs text-gray-500">{description}</p></div></button>)}</div>
    {error && <div role="alert" className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>}
    <Card><CardContent className="p-0"><div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-gray-900">{reports.find((report) => report.key === selected)?.title}</h2><p className="text-xs text-gray-500">{filteredRows.length} registros</p></div><div className="relative w-full sm:w-72"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtrar cualquier campo..." className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm" /></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3"><button type="button" onClick={() => sortBy(column)} className="inline-flex items-center gap-1 font-semibold hover:text-brand-800">{labels[column] ?? column}<ArrowUpDown size={13} /></button></th>)}</tr></thead><tbody className="divide-y divide-gray-100">{filteredRows.map((row, index) => <tr key={String(row.id ?? index)} className="hover:bg-gray-50">{columns.map((column) => <td key={column} className="max-w-xs truncate px-4 py-3 text-gray-700">{String(row[column] ?? '—')}</td>)}</tr>)}{filteredRows.length === 0 && <tr><td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center text-sm text-gray-500"><FileText className="mx-auto mb-2 text-gray-300" size={24} />No hay registros para este filtro.</td></tr>}</tbody></table></div></CardContent></Card>
  </div>;
}
