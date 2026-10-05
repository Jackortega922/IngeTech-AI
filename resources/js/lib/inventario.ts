// Disponibilidad que ve el cliente (Administración → inventario). No se muestra la cantidad
// exacta salvo cuando quedan pocas: "últimas unidades" ayuda a decidir sin exponer el almacén.
export const ULTIMAS_UNIDADES = 3;

export function disponibilidad(stock: number): { agotada: boolean; texto: string | null } {
    if (stock <= 0) return { agotada: true, texto: 'Agotada' };
    if (stock <= ULTIMAS_UNIDADES) return { agotada: false, texto: stock === 1 ? 'Última unidad' : `Últimas ${stock} unidades` };
    return { agotada: false, texto: null };
}
