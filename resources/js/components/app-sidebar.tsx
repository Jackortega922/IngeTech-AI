import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGrupo, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenText,
    Boxes,
    CircleHelp,
    Clock,
    Coins,
    FileSearch,
    GraduationCap,
    HeartHandshake,
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

// El menú se ordena por disciplina del proyecto: cada bloque muestra qué aporta cada una.
// Catálogo abierto al público: navegar y comparar specs no requiere cuenta. Solo la
// recomendación con IA (que guarda perfil e historial) pide iniciar sesión.
const navVisitante: NavGrupo[] = [
    {
        titulo: 'Tienda',
        items: [
            { title: 'Tienda', url: '/', icon: Store },
            { title: 'Catálogo', url: '/hardware', icon: Monitor },
            { title: 'Comparador', url: '/comparador', icon: Scale },
            { title: 'Seguimiento de pedido', url: '/seguimiento', icon: PackageSearch },
        ],
    },
    {
        titulo: 'Derecho',
        items: [
            { title: 'Términos y Garantía', url: '/derecho', icon: Scroll },
            { title: 'Libro de Reclamaciones', url: '/libro-reclamaciones', icon: BookOpenText },
            { title: 'Consultar mi reclamo', url: '/libro-reclamaciones/consultar', icon: FileSearch },
        ],
    },
    { titulo: 'Ayuda', items: [{ title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp }] },
];

const navCliente: NavGrupo[] = [
    {
        titulo: 'Mi cuenta',
        items: [
            { title: 'Mi panel', url: '/dashboard', icon: LayoutGrid },
            { title: 'Mis recomendaciones', url: '/historial', icon: Clock },
            { title: 'Mis pedidos', url: '/dashboard#pedidos', icon: Package },
        ],
    },
    {
        titulo: 'Tienda',
        items: [
            { title: 'Catálogo', url: '/hardware', icon: Monitor },
            { title: 'Comparador', url: '/comparador', icon: Scale },
        ],
    },
    // El cuestionario de bienvenida se puede revisar y cambiar cuando se quiera.
    { titulo: 'Psicología', items: [{ title: 'Mi cuestionario', url: '/bienvenida', icon: HeartHandshake }] },
    { titulo: 'Marketing', items: [{ title: 'Promociones', url: '/marketing', icon: Tag }] },
    { titulo: 'Ing. Ambiental', items: [{ title: 'Reciclaje y sostenibilidad', url: '/ing-ambiental', icon: Recycle }] },
    {
        titulo: 'Derecho',
        items: [
            { title: 'Términos y Garantía', url: '/derecho', icon: Scroll },
            { title: 'Libro de Reclamaciones', url: '/libro-reclamaciones', icon: BookOpenText },
            { title: 'Consultar mi reclamo', url: '/libro-reclamaciones/consultar', icon: FileSearch },
        ],
    },
    { titulo: 'Ayuda', items: [{ title: 'Preguntas frecuentes', url: '/preguntas', icon: CircleHelp }] },
];

// Personal de la tienda: solo las secciones de su rol (el permiso es el nombre de la pestaña).
// El flujo de recomendación es para los clientes.
const navAdmin: { titulo: string; items: (NavItem & { permiso: string })[] }[] = [
    {
        titulo: 'Ing. Industrial',
        items: [{ title: 'Dashboard', url: '/admin?tab=dashboard', icon: LayoutDashboard, permiso: 'dashboard' }],
    },
    {
        // Lo que alimenta al motor de recomendación y la tienda en línea.
        titulo: 'Ing. de Sistemas e IA',
        items: [
            { title: 'Pedidos', url: '/admin?tab=pedidos', icon: ShoppingBag, permiso: 'pedidos' },
            { title: 'Equipos', url: '/admin?tab=hardware', icon: Monitor, permiso: 'hardware' },
            { title: 'Software', url: '/admin?tab=software', icon: LayoutList, permiso: 'software' },
            { title: 'Carreras', url: '/admin?tab=carreras', icon: GraduationCap, permiso: 'carreras' },
        ],
    },
    {
        titulo: 'Administración',
        items: [
            { title: 'Inventario', url: '/admin?tab=inventario', icon: Boxes, permiso: 'inventario' },
            { title: 'Usuarios', url: '/admin?tab=usuarios', icon: UserCog, permiso: 'usuarios' },
        ],
    },
    {
        titulo: 'Contabilidad',
        items: [{ title: 'Contabilidad', url: '/admin?tab=contabilidad', icon: Coins, permiso: 'contabilidad' }],
    },
    {
        titulo: 'Marketing',
        items: [
            { title: 'Clientes', url: '/admin?tab=clientes', icon: Users, permiso: 'clientes' },
            { title: 'Marketing', url: '/admin?tab=marketing', icon: Megaphone, permiso: 'marketing' },
        ],
    },
    {
        titulo: 'Psicología',
        items: [{ title: 'Perfil de clientes', url: '/admin?tab=psicologia', icon: HeartHandshake, permiso: 'psicologia' }],
    },
    {
        titulo: 'Ing. Ambiental',
        items: [{ title: 'Recojo RAEE', url: '/admin?tab=ambiental', icon: Recycle, permiso: 'ambiental' }],
    },
    {
        titulo: 'Derecho',
        items: [{ title: 'Reclamos', url: '/admin?tab=reclamos', icon: BookOpenText, permiso: 'reclamos' }],
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    // El catálogo ahora es público (/hardware, /software, /comparador): esta pantalla se
    // renderiza también para quien no inició sesión, así que auth.user puede ser null.
    const usuario = auth.user;
    const esVisitante = usuario === null;
    // Al personal solo le aparecen las secciones de su rol; un bloque sin secciones no se muestra.
    const grupos: NavGrupo[] =
        usuario === null
            ? navVisitante
            : usuario.es_personal
              ? navAdmin.map((g) => ({ ...g, items: g.items.filter((i) => auth.permisos.includes(i.permiso)) })).filter((g) => g.items.length > 0)
              : navCliente;

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
                <NavMain grupos={grupos} />
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
