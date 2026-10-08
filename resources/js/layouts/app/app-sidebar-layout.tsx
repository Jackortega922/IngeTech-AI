import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import ChatWidget from '@/components/chat-widget';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            {/* min-w-0: sin esto el contenedor flex no puede ser más angosto que su contenido, y una
                tabla ancha (comparador, admin) estira toda la página hacia los costados en celular
                en vez de desplazarse solo dentro de su recuadro. */}
            <AppContent variant="sidebar" className="min-w-0">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <ChatWidget />
        </AppShell>
    );
}
