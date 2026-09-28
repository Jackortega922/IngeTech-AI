import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    CircleHelp,
    Clock,
    Coins,
    GraduationCap,
    LayoutDashboard,
    LayoutGrid,
    LayoutList,
    LogIn,
    Monitor,
    Receipt,
    Recycle,
    Scale,
    Scroll,
    Sparkles,
    Tag,
    UserPlus,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

// Catálogo abierto al público: navegar y comparar specs no requiere cuenta. Solo la
// recomendación con IA (que guarda perfil e historial) pide iniciar sesión.
const navVisitante: NavItem[] = [
    { title: 'Catálogo de hardware', url: '/hardware', icon: Monitor },
    { title: 'Catálogo de software', url: '/software', icon: LayoutList },
    { title: 'Comparador', url: '/comparador', icon: Scale },
];

const navCliente: NavItem[] = [
    { title: 'Inicio', url: '/dashboard', icon: LayoutGrid },
    { title: 'Nueva recomendación', url: '/perfil', icon: Sparkles },
    { title: 'Mis recomendaciones', url: '/historial', icon: Clock },
    { title: 'Catálogo de software', url: '/software', icon: LayoutList },
    { title: 'Catálogo de hardware', url: '/hardware', icon: Monitor },
    { title: 'Comparador', url: '/comparador', icon: Scale },
    { title: 'Promociones', url: '/marketing', icon: Tag },
    { title: 'Reciclaje y sostenibilidad', url: '/ing-ambiental', icon: Recycle },
    { title: 'Términos y Garantía', url: '/derecho', icon: Scroll },
    { title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp },
];

// Cuando entras como administrador, el menú solo muestra lo que le
// corresponde al admin — el flujo de recomendación es para los clientes.
const navAdmin: NavItem[] = [
    { title: 'Dashboard', url: '/admin?tab=dashboard', icon: LayoutDashboard },
    { title: 'Contabilidad', url: '/admin?tab=contabilidad', icon: Coins },
    { title: 'Clientes', url: '/admin?tab=clientes', icon: Users },
    { title: 'Cotizaciones', url: '/admin?tab=cotizaciones', icon: Receipt },
    { title: 'Equipos', url: '/admin?tab=hardware', icon: Monitor },
    { title: 'Software', url: '/admin?tab=software', icon: LayoutList },
    { title: 'Carreras', url: '/admin?tab=carreras', icon: GraduationCap },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    // El catálogo ahora es público (/hardware, /software, /comparador): esta pantalla se
    // renderiza también para quien no inició sesión, así que auth.user puede ser null.
    const usuario = auth.user;
    const esVisitante = usuario === null;
    const mainNavItems = usuario === null ? navVisitante : usuario.is_admin ? navAdmin : navCliente;
    const inicio = usuario === null ? '/' : usuario.is_admin ? '/admin' : '/dashboard';

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
                {esVisitante ? (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/register">
                                    <UserPlus />
                                    <span>Generar recomendación con IA</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/login">
                                    <LogIn />
                                    <span>Iniciar sesión</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                ) : (
                    <NavUser />
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
