const PREFIX = 'ingetech:catalog-image';
type CatalogKind = 'hardware' | 'software';

function normalizeId(id: number | string) { return String(id).trim(); }
function key(kind: CatalogKind, id: number | string) { return `${PREFIX}:${kind}:${normalizeId(id)}`; }

export function saveCatalogImage(kind: CatalogKind, id: number | string, value: string | null) {
    const normalized = normalizeId(id);
    if (typeof window === 'undefined' || !normalized || normalized === '0') return;
    try {
        if (value) window.localStorage.setItem(key(kind, normalized), value);
        else window.localStorage.removeItem(key(kind, normalized));
        window.dispatchEvent(new CustomEvent('ingetech:catalog-image-updated', { detail: { kind, id: normalized, value } }));
    } catch { /* El servidor sigue siendo la fuente de verdad cuando existe una URL pública. */ }
}

export function getCatalogImage(kind: CatalogKind, id: number | string, serverValue?: string | null) {
    if (serverValue) return serverValue;
    const normalized = normalizeId(id);
    if (typeof window === 'undefined' || !normalized || normalized === '0') return null;
    try { return window.localStorage.getItem(key(kind, normalized)); } catch { return null; }
}
