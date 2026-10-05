import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { LogOut, Settings, UserRound } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <UserInfo user={user} showEmail />
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        <UserRound className="h-3.5 w-3.5" /> {user.is_admin ? 'Administrador' : 'Cliente'}
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full items-center rounded-xl px-3 py-2.5"
                        href={route('profile.edit')}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" /> Configuración
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/30"
                    method="post"
                    href={route('logout')}
                    as="button"
                    onClick={cleanup}
                >
                    <LogOut className="mr-2" /> Cerrar sesión
                </Link>
            </DropdownMenuItem>
        </>
    );
}
