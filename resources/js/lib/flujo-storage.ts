import type { Perfil, Tarjeta } from '@/types/flujo';

// Las pantallas del flujo son rutas Inertia independientes, así que usamos
// sessionStorage para llevar el perfil, el resultado y la selección del
// comparador de una a otra sin tocar el backend en cada navegación.

const KEY_PERFIL = 'ingetech:perfil';
const KEY_TARJETAS = 'ingetech:tarjetas';
const KEY_SELECCIONADA = 'ingetech:seleccionada';
const KEY_COMPARAR = 'ingetech:comparar';

function leer<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function escribir<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(key, JSON.stringify(value));
}

export const flujoStorage = {
    guardarPerfil: (perfil: Perfil) => escribir(KEY_PERFIL, perfil),
    leerPerfil: () => leer<Perfil>(KEY_PERFIL),

    guardarTarjetas: (tarjetas: Tarjeta[]) => escribir(KEY_TARJETAS, tarjetas),
    leerTarjetas: () => leer<Tarjeta[]>(KEY_TARJETAS) ?? [],

    guardarSeleccionada: (tarjeta: Tarjeta) => escribir(KEY_SELECCIONADA, tarjeta),
    leerSeleccionada: () => leer<Tarjeta>(KEY_SELECCIONADA),

    leerComparar: () => leer<number[]>(KEY_COMPARAR) ?? [],
    guardarComparar: (ids: number[]) => escribir(KEY_COMPARAR, ids),

    limpiar: () => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.removeItem(KEY_PERFIL);
        window.sessionStorage.removeItem(KEY_TARJETAS);
        window.sessionStorage.removeItem(KEY_SELECCIONADA);
    },
};
