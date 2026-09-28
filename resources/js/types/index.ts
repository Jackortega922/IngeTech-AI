import { LucideIcon } from 'lucide-react';

export interface Auth {
    // El catálogo (/hardware, /software, /comparador) es público: en esas páginas no hay
    // sesión, así que user es null. Las páginas detrás de `auth` en routes/web.php sí pueden
    // asumirlo no nulo con seguridad.
    user: User | null;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Contacto {
    whatsapp: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    horario: string | null;
    redes: { facebook: string | null; instagram: string | null; tiktok: string | null; youtube: string | null };
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    contacto: Contacto;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    is_admin: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
