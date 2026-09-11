import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { hasSession } from '@/lib/auth';

export function AppShell() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  if (!hasSession()) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-svh bg-surface-muted">
      <Sidebar abiertoEnMovil={menuMovilAbierto} onCerrar={() => setMenuMovilAbierto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onAbrirMenu={() => setMenuMovilAbierto(true)} />
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
