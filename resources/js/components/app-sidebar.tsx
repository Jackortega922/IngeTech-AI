import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenText,
    Boxes,
    CircleHelp,
    Clock,
    Coins,
    GraduationCap,
    LayoutDashboard,
    LayoutGrid,
    LayoutList,
    LogIn,
    Monitor,
    Package,
    PackageSearch,
    Recycle,
    Scale,
    Scroll,
    ShoppingBag,
    Store,
    Tag,
    UserPlus,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

// Catálogo abierto al público: navegar y comparar specs no requiere cuenta. Solo la
// recomendación con IA (que guarda perfil e historial) pide iniciar sesión.
// "Tienda" (la portada) va primero en los dos menús: desde cualquier pantalla se tiene que
// poder volver a la vitrina, con o sin sesión.
const navVisitante: NavItem[] = [
    { title: 'Tienda', url: '/', icon: Store },
    { title: 'Catálogo', url: '/hardware', icon: Monitor },
    { title: 'Comparador', url: '/comparador', icon: Scale },
    { title: 'Seguimiento de pedido', url: '/seguimiento', icon: PackageSearch },
    { title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp },
    { title: 'Términos y Garantía', url: '/derecho', icon: Scroll },
    { title: 'Libro de Reclamaciones', url: '/libro-reclamaciones', icon: BookOpenText },
];

const navCliente: NavItem[] = [
    { title: 'Tienda', url: '/', icon: Store },
    { title: 'Mi panel', url: '/dashboard', icon: LayoutGrid },
    { title: 'Mis recomendaciones', url: '/historial', icon: Clock },
    { title: 'Mis pedidos', url: '/dashboard#pedidos', icon: Package },
    { title: 'Catálogo', url: '/hardware', icon: Monitor },
    { title: 'Comparador', url: '/comparador', icon: Scale },
    { title: 'Promociones', url: '/marketing', icon: Tag },
    { title: 'Reciclaje y sostenibilidad', url: '/ing-ambiental', icon: Recycle },
    { title: 'Términos y Garantía', url: '/derecho', icon: Scroll },
    { title: 'Libro de Reclamaciones', url: '/libro-reclamaciones', icon: BookOpenText },
    { title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp },
];

// Cuando entras como administrador, el menú solo muestra lo que le
// corresponde al admin — el flujo de recomendación es para los clientes.
const navAdmin: NavItem[] = [
    { title: 'Dashboard', url: '/admin?tab=dashboard', icon: LayoutDashboard },
    { title: 'Contabilidad', url: '/admin?tab=contabilidad', icon: Coins },
    { title: 'Clientes', url: '/admin?tab=clientes', icon: Users },
    { title: 'Pedidos', url: '/admin?tab=pedidos', icon: ShoppingBag },
    { title: 'Inventario', url: '/admin?tab=inventario', icon: Boxes },
    { title: 'Reclamos', url: '/admin?tab=reclamos', icon: BookOpenText },
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

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-[#07182c]">
            <SidebarHeader className="border-b border-slate-200/70 pb-3 dark:border-slate-800">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            {/* El logo lleva a la tienda, como en cualquier sitio de compras. */}
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="it-scrollbar px-1">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200/70 pt-2 dark:border-slate-800">
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
