import { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { getSessionUser } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import { loadConfiguration, request, type AdminUser, type Configuration } from '../lib/config';

const today = new Date().toISOString().slice(0, 10);
const blank = { email: '', username: '', password: '', subscriptionType: 'FREE', companiaId: '', validFrom: today, validUntil: '2099-12-31' };

function ReadOnlyDate({ translationKey, value }: { translationKey: string; value?: string | null }) {
  const { t } = useLanguage();
  return (
    <label className="text-sm font-medium text-gray-700">
      {t(translationKey)}
      <input
        value={value ? new Date(value).toLocaleString('es-CO') : 'Aún no disponible'}
        readOnly
        disabled
        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
      />
    </label>
  );
}

export function UsuariosPage() {
  const isAdmin = getSessionUser()?.subscriptionType === 'ADMIN';
  const currentUserId = getSessionUser()?.id;
  const { t } = useLanguage();
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [draft, setDraft] = useState(blank);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([loadConfiguration(), request<{ users: AdminUser[] }>('/api/admin/users')])
      .then(([config, data]) => {
        setConfiguration(config);
        setUsers(data.users);
      })
      .catch((value) => setError(value instanceof Error ? value.message : 'No fue posible cargar los usuarios.'));
  }, []);

  if (!isAdmin) return <Navigate to="/" replace />;

  function selectUser(user: AdminUser) {
    setSelectedId(user.id);
    setSelectedUser(user);
    setDraft({
      email: user.email,
      username: user.username,
      password: '',
      subscriptionType: user.subscriptionType,
      companiaId: user.companiaId ?? '',
      validFrom: user.validFrom.slice(0, 10),
      validUntil: user.validUntil.slice(0, 10),
    });
  }

  function newUser() {
    setSelectedId(null);
    setSelectedUser(null);
    setDraft(blank);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const path = selectedId ? `/api/admin/users/${selectedId}` : '/api/admin/users';
      const data = await request<{ users: AdminUser[] }>(path, {
        method: selectedId ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...draft, companiaId: draft.companiaId || null }),
      });
      setUsers(data.users);
      setMessage(selectedId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
      if (!selectedId) setDraft(blank);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No fue posible guardar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(user: AdminUser) {
    if (user.id === currentUserId) {
      setError('No puedes eliminar el usuario con el que estás conectado.');
      return;
    }
    if (!window.confirm(`¿Eliminar el usuario ${user.username}?`)) return;
    setSaving(true);
    try {
      const data = await request<{ users: AdminUser[] }>(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      setUsers(data.users);
      if (selectedId === user.id) newUser();
      setMessage('Usuario eliminado correctamente.');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No fue posible eliminar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Gestión de usuarios"
        descripcion="Crea, modifica y elimina usuarios, suscripciones y compañías asignadas."
        breadcrumbs={[{ label: 'Parametrización', to: '/parametrizacion' }, { label: 'Gestión de usuarios' }]}
        accion={
          <Link to="/parametrizacion" className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:underline">
            <ArrowLeft size={16} /> Volver
          </Link>
        }
      />
      {message && (
        <div className="rounded-lg border border-success-500/30 bg-success-50 px-4 py-3 text-sm text-success-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader
            title="Usuarios"
            description={`${users.length} usuarios registrados`}
            action={
              <Button tamano="sm" icono={<Plus size={15} />} onClick={newUser}>
                Nuevo
              </Button>
            }
          />
          <CardContent className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-3">
                <button
                  type="button"
                  onClick={() => selectUser(user)}
                  className="min-w-0 flex-1 text-left"
                >
                  <strong className="block truncate text-sm text-gray-900">{user.username}</strong>
                  <span className="block truncate text-xs text-gray-500">{user.email}</span>
                  <span className="text-xs text-brand-700">
                    {user.subscriptionType}
                    {user.companiaNombre ? ` · ${user.companiaNombre}` : ''}
                  </span>
                </button>
                <Button type="button" tamano="sm" onClick={() => selectUser(user)} icono={<Edit2 size={14} />}>
                  Editar
                </Button>
                <Button type="button" tamano="sm" variante="peligro" onClick={() => remove(user)} icono={<Trash2 size={14} />}>
                  Eliminar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title={selectedId ? 'Editar usuario' : 'Crear usuario'}
            description="La compañía, suscripción y vigencia solo pueden ser asignadas por un administrador."
          />
          <CardContent>
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Correo"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                required
              />
              <TextField
                label="Usuario"
                value={draft.username}
                onChange={(event) => setDraft({ ...draft, username: event.target.value })}
                required
              />
              <TextField
                label={selectedId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                type="password"
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                required={!selectedId}
                minLength={8}
              />
              <label className="text-sm font-medium text-gray-700">
                Suscripción
                <select
                  value={draft.subscriptionType}
                  onChange={(event) => setDraft({ ...draft, subscriptionType: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  {configuration?.subscriptions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t('users.validFrom')}
                <input
                  type="date"
                  value={draft.validFrom}
                  onChange={(event) => setDraft({ ...draft, validFrom: event.target.value })}
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t('users.validUntil')}
                <input
                  type="date"
                  value={draft.validUntil}
                  onChange={(event) => setDraft({ ...draft, validUntil: event.target.value })}
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="sm:col-span-2 text-sm font-medium text-gray-700">
                Compañía
                <select
                  value={draft.companiaId}
                  onChange={(event) => setDraft({ ...draft, companiaId: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">Sin compañía asignada</option>
                  {configuration?.companias.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
                <ReadOnlyDate translationKey="users.createdAt" value={selectedUser?.createdAt} />
                <ReadOnlyDate translationKey="users.updatedAt" value={selectedUser?.updatedAt} />
                <ReadOnlyDate translationKey="users.lastLoginAt" value={selectedUser?.lastLoginAt} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" variante="primario" disabled={saving} icono={<Save size={15} />}>
                  {saving ? 'Guardando...' : selectedId ? 'Guardar cambios' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
