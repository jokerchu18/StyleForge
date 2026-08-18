import type { ReactNode } from 'react';
import SiteHeader from './SiteHeader';

/** Global shell: top nav + white content area (no left sidebar). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="app-content">{children}</main>
    </div>
  );
}
