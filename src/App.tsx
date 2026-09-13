import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { ToastProvider } from '@/hooks/useToast';
import { LanguageProvider } from '@/lib/LanguageContext';
import { SidebarProvider } from '@/lib/SidebarContext';
import { FloatingChat } from '@/components/FloatingChat';
import { FloatingAssistant } from '@/features/asistente';
import { AudienciasProvider } from '@/features/audiencias/store';
import { MarcasProvider } from '@/features/marcas/store';
import { ActivosProvider } from '@/features/activos/store';
import { OportunidadesProvider } from '@/features/oportunidades/store';
import { AcuerdosProvider } from '@/features/acuerdos/store';
import { CompromisosProvider } from '@/features/compromisos/store';
import { EvidenciasProvider } from '@/features/evidencias/store';

export function App() {
  return (
    <LanguageProvider>
      <SidebarProvider>
        <ToastProvider>
          <AudienciasProvider>
            <MarcasProvider>
              <ActivosProvider>
                <OportunidadesProvider>
                  <AcuerdosProvider>
                    <CompromisosProvider>
                      <EvidenciasProvider>
                        <RouterProvider router={router} />
                        <FloatingChat />
                        <FloatingAssistant />
                      </EvidenciasProvider>
                    </CompromisosProvider>
                  </AcuerdosProvider>
                </OportunidadesProvider>
              </ActivosProvider>
            </MarcasProvider>
          </AudienciasProvider>
        </ToastProvider>
      </SidebarProvider>
    </LanguageProvider>
  );
}
