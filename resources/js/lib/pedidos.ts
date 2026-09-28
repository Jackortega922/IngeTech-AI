import type { EstadoPedido } from '@/types/flujo';

// Mismo orden que Pedido::ESTADOS en el backend.
export const ESTADOS_PEDIDO: { value: EstadoPedido; label: string; clase: string }[] = [
    { value: 'pagado', label: 'Pagado', clase: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' },
    { value: 'preparando', label: 'Preparando', clase: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    { value: 'enviado', label: 'Enviado', clase: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
    { value: 'entregado', label: 'Entregado', clase: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    { value: 'cancelado', label: 'Cancelado', clase: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
];

export function estadoPedido(value: EstadoPedido) {
    return ESTADOS_PEDIDO.find((e) => e.value === value) ?? ESTADOS_PEDIDO[0];
}

export const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// --- Pago simulado -------------------------------------------------------------------------
// Se valida en el navegador, como hace el formulario de una pasarela real antes de tokenizar.
// Al servidor solo viajan la marca y los últimos 4 dígitos: el número completo nunca sale de aquí.

export type MarcaTarjeta = 'visa' | 'mastercard' | 'amex';

export function marcaDe(numero: string): MarcaTarjeta | null {
    if (/^4/.test(numero)) return 'visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(numero)) return 'mastercard';
    if (/^3[47]/.test(numero)) return 'amex';
    return null;
}

// Algoritmo de Luhn: el dígito verificador que traen todas las tarjetas. Detecta errores de tipeo.
export function luhnValido(numero: string): boolean {
    if (!/^\d{13,19}$/.test(numero)) return false;
    let suma = 0;
    [...numero].reverse().forEach((c, i) => {
        let d = Number(c);
        if (i % 2 === 1) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        suma += d;
    });
    return suma % 10 === 0;
}

export function vencimientoValido(mmaa: string, hoy = new Date()): boolean {
    const m = /^(\d{2})\/(\d{2})$/.exec(mmaa);
    if (!m) return false;
    const mes = Number(m[1]);
    const anio = 2000 + Number(m[2]);
    if (mes < 1 || mes > 12) return false;
    // Vence al final de ese mes.
    return new Date(anio, mes, 1) > hoy;
}

export const TARJETAS_PRUEBA = [
    { numero: '4242 4242 4242 4242', resultado: 'aprobada' },
    { numero: '4000 0000 0000 0002', resultado: 'rechazada' },
];
