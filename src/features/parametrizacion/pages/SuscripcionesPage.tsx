import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, Plus, Save, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { getSessionUser } from '@/lib/auth';
import { formatCOP } from '@/lib/format';
import { loadConfiguration, request, type Configuration, type Subscription } from '../lib/config';

export function SuscripcionesPage() {
  const isAdmin = getSessionUser()?.subscriptionType === 'ADMIN';
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [draft, setDraft] = useState<Subscription | null>(null);
  const [newPlan, setNewPlan] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfiguration()
      .then((data) => {
        setConfiguration(data);
        setSelectedCode(data.subscriptions[0]?.code ?? '');
      })
      .catch((value) =>
        setError(value instanceof Error ? value.message : 'No fue posible cargar los planes.'),
      );
  }, []);

  useEffect(() => {
    const selected = configuration?.subscriptions.find((item) => item.code === selectedCode);
    setDraft(selected ? { ...selected, features: [...selected.features] } : null);
    setNewPlan(false);
  }, [configuration, selectedCode]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const featureOptions = configuration?.menuOptions.map((option) => option.label) ?? [];

  function toggleFeature(feature: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      features: draft.features.includes(feature)
        ? draft.features.filter((item) => item !== feature)
        : [...draft.features, feature],
    });
  }

  function startNew() {
    setNewPlan(true);
    setFeaturesOpen(false);
    setDraft({
      code: '',
      name: '',
      description: '',
      priceCop: 0,
      maxUsers: null,
      features: [],
      isActive: true,
    });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const data = await request<Configuration>(
        newPlan ? '/api/admin/subscriptions' : `/api/admin/subscriptions/${encodeURIComponent(draft.code)}`,
        {
          method: newPlan ? 'POST' : 'PATCH',
          body: JSON.stringify(draft),
        },
      );
      setConfiguration(data);
      setSelectedCode(draft.code);
      setNewPlan(false);
      setMessage('Plan guardado correctamente.');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No fue posible guardar el plan.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!draft || !window.confirm(`¿Eliminar la suscripción ${draft.name}?`)) return;
    setSaving(true);
    setError('');
    try {
      const data = await request<Configuration>(
        `/api/admin/subscriptions/${encodeURIComponent(draft.code)}`,
        { method: 'DELETE' },
      );
      setConfiguration(data);
      setSelectedCode(data.subscriptions[0]?.code ?? '');
      setMessage('Plan eliminado correctamente.');
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'No fue posible eliminar el plan. Verifica que no tenga usuarios o accesos asociados.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Suscripciones"
        descripcion="Configura los planes, precios, límites y características disponibles."
        breadcrumbs={[
          { label: 'Parametrización', to: '/parametrizacion' },
          { label: 'Suscripciones' },
        ]}
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

      <Card>
        <CardHeader
          title="Planes disponibles"
          description="Selecciona un plan para editarlo, eliminarlo o crea uno nuevo."
          action={
            <Button tamano="sm" icono={<Plus size={15} />} onClick={startNew}>
              Nuevo plan
            </Button>
          }
        />
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div className="space-y-2">
            {configuration?.subscriptions.map((item) => (
              <div
                key={item.code}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  selectedCode === item.code ? 'border-brand-700 bg-brand-800/5' : 'border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCode(item.code)}
                  className="min-w-0 flex-1 text-left"
                >
                  <strong className="block truncate text-sm text-gray-900">{item.name}</strong>
                  <span className="text-xs text-gray-500">
                    {item.code} • {formatCOP(item.priceCop)}
                  </span>
                </button>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.isActive ? 'bg-success-500' : 'bg-gray-300'
                  }`}
                />
              </div>
            ))}
          </div>

          {draft && (
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Código"
                value={draft.code}
                disabled={!newPlan}
                onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
                required
              />
              <TextField
                label="Nombre"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                required
              />
              <TextField
                label="Precio COP"
                value={draft.priceCop > 0 ? formatCOP(draft.priceCop) : ''}
                onChange={(event) =>
                  setDraft({ ...draft, priceCop: Number(event.target.value.replace(/\D/g, '')) })
                }
                placeholder="0"
              />
              <TextField
                label="Máximo de usuarios"
                type="number"
                min="1"
                placeholder="Sin límite"
                value={draft.maxUsers ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    maxUsers: event.target.value ? Number(event.target.value) : null,
                  })
                }
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Descripción"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </div>
              <div className="relative sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Características</span>
                <button
                  type="button"
                  onClick={() => setFeaturesOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900"
                >
                  <span>
                    {draft.features.length
                      ? `${draft.features.length} seleccionadas`
                      : 'Selecciona las características'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {featuresOpen && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                    {[...new Set([...featureOptions, ...draft.features])].map((feature) => (
                      <label
                        key={feature}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={draft.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="h-4 w-4"
                        />
                        {feature}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button
                  type="submit"
                  variante="primario"
                  disabled={saving}
                  icono={<Save size={15} />}
                >
                  {saving ? 'Guardando...' : 'Guardar plan'}
                </Button>
                {!newPlan && (
                  <Button
                    type="button"
                    variante="peligro"
                    disabled={saving}
                    onClick={remove}
                    icono={<Trash2 size={15} />}
                  >
                    Eliminar plan
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
