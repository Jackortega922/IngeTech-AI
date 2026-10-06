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
    FileSearch,
    GraduationCap,
    LayoutDashboard,
    LayoutGrid,
    LayoutList,
    LogIn,
    Megaphone,
    Monitor,
    Package,
    PackageSearch,
    Recycle,
    Scale,
    Scroll,
    ShoppingBag,
    Store,
    Tag,
    UserCog,
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
    { title: 'Consultar mi reclamo', url: '/libro-reclamaciones/consultar', icon: FileSearch },
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
    { title: 'Consultar mi reclamo', url: '/libro-reclamaciones/consultar', icon: FileSearch },
    { title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp },
];

// Personal de la tienda: solo las secciones de su rol (el permiso es el nombre de la pestaña).
// El flujo de recomendación es para los clientes.
const navAdmin: (NavItem & { permiso: string })[] = [
    { title: 'Dashboard', url: '/admin?tab=dashboard', icon: LayoutDashboard, permiso: 'dashboard' },
    { title: 'Contabilidad', url: '/admin?tab=contabilidad', icon: Coins, permiso: 'contabilidad' },
    { title: 'Clientes', url: '/admin?tab=clientes', icon: Users, permiso: 'clientes' },
    { title: 'Pedidos', url: '/admin?tab=pedidos', icon: ShoppingBag, permiso: 'pedidos' },
    { title: 'Inventario', url: '/admin?tab=inventario', icon: Boxes, permiso: 'inventario' },
    { title: 'Reclamos', url: '/admin?tab=reclamos', icon: BookOpenText, permiso: 'reclamos' },
    { title: 'Marketing', url: '/admin?tab=marketing', icon: Megaphone, permiso: 'marketing' },
    { title: 'Equipos', url: '/admin?tab=hardware', icon: Monitor, permiso: 'hardware' },
    { title: 'Software', url: '/admin?tab=software', icon: LayoutList, permiso: 'software' },
    { title: 'Carreras', url: '/admin?tab=carreras', icon: GraduationCap, permiso: 'carreras' },
    { title: 'Usuarios', url: '/admin?tab=usuarios', icon: UserCog, permiso: 'usuarios' },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    // El catálogo ahora es público (/hardware, /software, /comparador): esta pantalla se
    // renderiza también para quien no inició sesión, así que auth.user puede ser null.
    const usuario = auth.user;
    const esVisitante = usuario === null;
    const mainNavItems =
        usuario === null ? navVisitante : usuario.es_personal ? navAdmin.filter((i) => auth.permisos.includes(i.permiso)) : navCliente;

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
