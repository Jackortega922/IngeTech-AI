import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGrupo } from '@/types';
import { Link, usePage } from '@inertiajs/react';

// Menú lateral en bloques con título (las disciplinas del proyecto). Con el menú contraído solo
// quedan los íconos: los títulos se ocultan solos.
export function NavMain({ grupos = [] }: { grupos: NavGrupo[] }) {
    const page = usePage();
    return (
        <>
            {grupos.map((grupo) => (
                <SidebarGroup key={grupo.titulo} className="px-2 py-1.5">
                    <SidebarGroupLabel className="px-3 pb-1 text-[10px] font-black tracking-[.18em] text-slate-400 uppercase">
                        {grupo.titulo}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {grupo.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={item.url === page.url}
                                    className="h-10 rounded-xl px-3 font-semibold transition-all hover:bg-slate-100 data-[active=true]:bg-[var(--it-primary-soft)] data-[active=true]:text-[var(--it-primary)] data-[active=true]:shadow-sm dark:hover:bg-slate-800/70"
                                >
                                    {/* Entre secciones del panel admin se conserva lo ya cargado (no se vuelve a pedir todo). */}
                                    <Link href={item.url} prefetch preserveState={item.url.startsWith('/admin')}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
