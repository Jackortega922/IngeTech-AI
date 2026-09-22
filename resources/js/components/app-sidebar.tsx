import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CircleHelp, Clock, GraduationCap, LayoutDashboard, LayoutGrid, LayoutList, Monitor, Scale, Sparkles, Users } from 'lucide-react';
import AppLogo from './app-logo';

const navEstudiante: NavItem[] = [
    { title: 'Inicio', url: '/dashboard', icon: LayoutGrid },
    { title: 'Nueva recomendación', url: '/perfil', icon: Sparkles },
    { title: 'Mis recomendaciones', url: '/historial', icon: Clock },
    { title: 'Catálogo de software', url: '/software', icon: LayoutList },
    { title: 'Catálogo de hardware', url: '/hardware', icon: Monitor },
    { title: 'Comparador', url: '/comparador', icon: Scale },
    { title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp },
];

// Cuando entras como administrador, el menú solo muestra lo que le
// corresponde al admin — el flujo de recomendación es para estudiantes.
const navAdmin: NavItem[] = [
    { title: 'Dashboard', url: '/admin?tab=dashboard', icon: LayoutDashboard },
    { title: 'Clientes', url: '/admin?tab=clientes', icon: Users },
    { title: 'Equipos', url: '/admin?tab=hardware', icon: Monitor },
    { title: 'Software', url: '/admin?tab=software', icon: LayoutList },
    { title: 'Carreras', url: '/admin?tab=carreras', icon: GraduationCap },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const mainNavItems = auth.user.is_admin ? navAdmin : navEstudiante;
    const inicio = auth.user.is_admin ? '/admin' : '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={inicio} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
