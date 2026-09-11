import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useLanguage } from '@/lib/LanguageContext';
import { useAudiencias } from '../store';
import { InfoDeslindeGO } from '../components/InfoDeslindeGO';
import { ResumenTab } from '../components/ResumenTab';
import { SegmentosTab } from '../components/SegmentosTab';
import { CanalesTab } from '../components/CanalesTab';
import { CampanasTab } from '../components/CampanasTab';

type TabId = 'resumen' | 'segmentos' | 'canales' | 'campanas';

export function AudienciasPage() {
  const { t } = useLanguage();
  const { segmentos, canales, capacidades, campanas } = useAudiencias();
  const [tabActiva, setTabActiva] = useState<TabId>('resumen');
  const [filtroSegmentoParaCampanas, setFiltroSegmentoParaCampanas] = useState<string | null>(null);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'resumen', label: t('misc.resumen') },
    { id: 'segmentos', label: t('misc.segmentos') },
    { id: 'canales', label: t('misc.canales') },
    { id: 'campanas', label: t('misc.campanasResultados') },
  ];

  function irACampanasFiltradasPorSegmento(segmentoId: string) {
    setFiltroSegmentoParaCampanas(segmentoId);
    setTabActiva('campanas');
  }

  return (
    <div>
      <PageHeader
        titulo={t('audiencias.header')}
        descripcion={t('audiencias.descripcion')}
        etiqueta={t('audiencias.demoDatos')}
      />

      <InfoDeslindeGO />

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label={t('misc.tabsAudiencias')}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabActiva(tab.id)}
              aria-current={tabActiva === tab.id ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tabActiva === tab.id
                  ? 'border-brand-800 text-brand-800'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {tabActiva === 'resumen' && <ResumenTab capacidades={capacidades} />}
      {tabActiva === 'segmentos' && (
        <SegmentosTab
          segmentos={segmentos}
          capacidades={capacidades}
          campanas={campanas}
          onVerCampanas={irACampanasFiltradasPorSegmento}
        />
      )}
      {tabActiva === 'canales' && <CanalesTab canales={canales} />}
      {tabActiva === 'campanas' && (
        <CampanasTab
          campanas={campanas}
          segmentos={segmentos}
          filtroSegmentoInicial={filtroSegmentoParaCampanas}
          onLimpiarFiltroSegmento={() => setFiltroSegmentoParaCampanas(null)}
        />
      )}
    </div>
  );
}
