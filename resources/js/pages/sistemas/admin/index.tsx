import { LoadingPanel } from '@/components/loading-panel';
import AppLayout from '@/layouts/app-layout';
import { PanelContabilidad } from '@/pages/contabilidad/panel-contabilidad';
import { PanelDashboard } from '@/pages/industrial/panel-dashboard';
import { type BreadcrumbItem } from '@/types';
import type { Carrera, Catalogos, Cliente, ContabilidadAdmin, DashboardAdmin, Laptop, Software } from '@/types/flujo';
import { Head } from '@inertiajs/react';
import { getCatalogImage, saveCatalogImage } from '@/lib/catalog-images';
import {
    AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Edit3, Eye, ImagePlus, LayoutDashboard, Laptop as LaptopIcon,
    Package, Plus, RefreshCw, Search, Shield, Trash2, Upload, Users, X, GraduationCap, Coins, Database, Save,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Administración', href: '/admin' }];
type Sub = 'dashboard' | 'contabilidad' | 'clientes' | 'hardware' | 'software' | 'carreras';
const TABS: { value: Sub; label: string; icon: typeof LayoutDashboard }[] = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'contabilidad', label: 'Contabilidad', icon: Coins },
    { value: 'clientes', label: 'Usuarios', icon: Users },
    { value: 'hardware', label: 'Equipos', icon: LaptopIcon },
    { value: 'software', label: 'Software', icon: Package },
    { value: 'carreras', label: 'Carreras', icon: GraduationCap },
];

async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) {
        let message = 'No se pudo completar la operación.';
        try { const data = await res.json(); message = data.message ?? data.error ?? message; } catch { /* no-op */ }
        throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
}

function extractSavedId(result: unknown, fallback: number | string = 0) {
    if (typeof result === 'number' || typeof result === 'string') return Number(result);
    if (!result || typeof result !== 'object') return Number(fallback) || 0;
    const source = result as Record<string, unknown>;
    const nested = [source.id, (source.data as Record<string, unknown> | undefined)?.id, (source.hardware as Record<string, unknown> | undefined)?.id, (source.software as Record<string, unknown> | undefined)?.id];
    const found = nested.find((x) => x !== undefined && x !== null && String(x) !== '');
    return Number(found ?? fallback) || 0;
}

function initialTab(): Sub {
    if (typeof window === 'undefined') return 'dashboard';
    const value = new URLSearchParams(window.location.search).get('tab') as Sub | null;
    return TABS.some((tab) => tab.value === value) ? value! : 'dashboard';
}

function Modal({ open, title, description, onClose, children, footer }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
    if (!open) return null;
    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <section className="it-modal" onMouseDown={(e) => e.stopPropagation()}>
                <header className="it-modal-header">
                    <div><p className="it-eyebrow">Gestión de catálogo</p><h2 className="mt-1 text-xl font-bold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
                    <button type="button" className="it-icon-btn" onClick={onClose}><X className="h-4 w-4" /></button>
                </header>
                <div className="it-modal-body it-scrollbar">{children}</div>
                <footer className="it-modal-footer">{footer}</footer>
            </section>
        </div>
    );
}

function ImagePicker({ value, onChange, label = 'Imagen principal' }: { value?: string | null; onChange: (value: string | null) => void; label?: string }) {
    const ref = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(value ?? null);
    const [url, setUrl] = useState(value && !value.startsWith('data:') ? value : '');
    const [active, setActive] = useState(0);
    const [extra, setExtra] = useState<string[]>([]);
    const [error, setError] = useState('');
    useEffect(() => {
        setPreview(value ?? null);
        setUrl(value && !value.startsWith('data:') ? value : '');
        setActive(0);
    }, [value]);
    const images = [preview, ...extra].filter(Boolean) as string[];
    function read(file: File) {
        return new Promise<string>((resolve, reject) => {
            if (!file.type.startsWith('image/')) return reject(new Error('Selecciona una imagen válida.'));
            if (file.size > 8 * 1024 * 1024) return reject(new Error('La imagen original debe pesar menos de 8 MB.'));
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            reader.onload = () => {
                const source = new Image();
                source.onload = () => {
                    const max = 1600;
                    const scale = Math.min(1, max / Math.max(source.width, source.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(source.width * scale));
                    canvas.height = Math.max(1, Math.round(source.height * scale));
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(String(reader.result));
                    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                source.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
                source.src = String(reader.result);
            };
            reader.readAsDataURL(file);
        });
    }
    async function add(e: ChangeEvent<HTMLInputElement>) {
        setError('');
        const files = Array.from(e.target.files ?? []).slice(0, 6 - images.length);
        try {
            const urls = await Promise.all(files.map(read));
            if (!urls.length) return;
            if (!preview) { setPreview(urls[0]); onChange(urls[0]); setActive(0); setExtra((old) => [...old, ...urls.slice(1)].slice(0, 5)); }
            else setExtra((old) => [...old, ...urls].slice(0, 5));
        } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.'); }
        e.target.value = '';
    }
    function applyUrl(value: string) {
        setUrl(value);
        setError('');
        if (!value) { setPreview(null); onChange(null); return; }
        setPreview(value); setActive(0); onChange(value);
    }
    function remove(index: number) {
        if (index === 0) {
            const next = extra[0] ?? null;
            setPreview(next); onChange(next); setExtra((old) => old.slice(1)); setActive(0); return;
        }
        setExtra((old) => old.filter((_, i) => i !== index - 1));
        setActive(Math.max(0, Math.min(active, images.length - 2)));
    }
    const current = images[active] ?? null;
    return (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-slate-500">Carga imágenes para la ficha o pega una URL pública.</p></div>
                <button type="button" onClick={() => ref.current?.click()} className="it-btn it-btn-secondary h-10 px-4"><Upload className="h-4 w-4" /> Seleccionar imágenes</button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                <div className="relative overflow-hidden rounded-2xl border bg-slate-100 dark:bg-slate-950">
                    <div className="aspect-[16/9] w-full">
                        {current ? <img src={current} alt="Vista previa del producto" className="h-full w-full object-cover" /> : <button type="button" onClick={() => ref.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400 hover:text-[var(--it-primary)]"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm dark:bg-slate-900"><ImagePlus className="h-7 w-7" /></div><span className="text-sm font-semibold">Selecciona una imagen</span><small>PNG, JPG o WEBP · se optimiza automáticamente</small></button>}
                    </div>
                    {images.length > 1 && <><button type="button" aria-label="Imagen anterior" onClick={() => setActive((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-white shadow-lg"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Imagen siguiente" onClick={() => setActive((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-white shadow-lg"><ChevronRight className="h-4 w-4" /></button></>}
                </div>
                <div className="space-y-3">
                    <label className="it-form-label">URL pública de la imagen<input className="it-form-input" value={url} onChange={(e) => applyUrl(e.target.value)} placeholder="https://.../equipo.webp" /></label>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs leading-5 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200"><b>Consejo:</b> para que todos los usuarios vean la imagen después de recargar, usa una URL pública o una ruta servida por Laravel. Las imágenes seleccionadas desde tu PC se mantienen como vista previa en este navegador.</div>
                    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
                </div>
            </div>
            {images.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{images.map((img, i) => <div key={`${i}-${img.slice(-12)}`} className={`group relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === active ? 'border-[var(--it-primary)]' : 'border-transparent'}`}><button type="button" onClick={() => setActive(i)} className="h-full w-full"><img src={img} alt={`Miniatura ${i + 1}`} className="h-full w-full object-cover" /></button><button type="button" title="Eliminar imagen" onClick={() => remove(i)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white opacity-0 shadow transition group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button></div>)}<button type="button" onClick={() => ref.current?.click()} className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-dashed text-slate-400 hover:border-[var(--it-primary)] hover:text-[var(--it-primary)]"><Plus className="h-4 w-4" /></button></div>}
            <input ref={ref} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => void add(e)} />
        </div>
    );
}

const emptyHardware = (): Laptop => ({ id: 0, marca: '', modelo: '', descripcion: '', imagen_url: null, tipo: 'laptop', cpu: '', ram_gb: 8, ram_ampliable_gb: null, almacenamiento_gb: 512, almacenamiento_tipo: 'SSD', gpu: '', gpu_dedicada: false, bateria_horas: 8, precio_soles: 2000, tienda: '', rendimiento_score: 50 });
const emptySoftware = (): Software => ({ id: 0, clave: `software_${Date.now()}`, nombre: '', descripcion: '', imagen_url: null, categoria: 'General', min_ram_gb: 4, min_cpu_score: 20, min_gpu_dedicada: false, rec_ram_gb: 8, rec_cpu_score: 30, rec_gpu_dedicada: false });

export default function AdminIndex() {
    const [sub, setSub] = useState<Sub>(initialTab());
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [dashboard, setDashboard] = useState<DashboardAdmin | null>(null);
    const [contabilidad, setContabilidad] = useState<ContabilidadAdmin | null>(null);
    const [clientes, setClientes] = useState<Cliente[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Cada bloque se carga de forma independiente. Antes, si una ruta
        // administrativa fallaba (por ejemplo contabilidad), Promise.all
        // dejaba todo el panel sin datos y al cambiar a Equipos/Software
        // podía terminar en una pantalla blanca.
        const getJson = async (url: string) => {
            const response = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
            return response.json();
        };

        const [catalogResult, dashboardResult, accountingResult, clientsResult] = await Promise.allSettled([
            getJson('/api/catalogos'),
            getJson('/api/admin/dashboard'),
            getJson('/api/admin/contabilidad'),
            getJson('/api/admin/clientes'),
        ]);

        const problems: string[] = [];

        if (catalogResult.status === 'fulfilled') {
            const raw = catalogResult.value ?? {};
            // Acepta tanto el contrato actual (hardware) como variantes
            // anteriores (laptops/equipos), evitando un crash si el backend
            // entrega un nombre distinto temporalmente.
            setCatalogos({
                carreras: Array.isArray(raw.carreras) ? raw.carreras : [],
                software: Array.isArray(raw.software) ? raw.software : [],
                hardware: Array.isArray(raw.hardware) ? raw.hardware : Array.isArray(raw.laptops) ? raw.laptops : Array.isArray(raw.equipos) ? raw.equipos : [],
                actividades: Array.isArray(raw.actividades) ? raw.actividades : [],
                accesorios: Array.isArray(raw.accesorios) ? raw.accesorios : [],
                kits: Array.isArray(raw.kits) ? raw.kits : [],
            });
        } else {
            problems.push('No se pudo cargar el catálogo.');
            setCatalogos({ carreras: [], software: [], hardware: [], actividades: [], accesorios: [], kits: [] });
        }

        if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value);
        else problems.push('No se pudo cargar el dashboard.');

        if (accountingResult.status === 'fulfilled') setContabilidad(accountingResult.value);
        else problems.push('No se pudo cargar contabilidad.');

        if (clientsResult.status === 'fulfilled') setClientes(Array.isArray(clientsResult.value) ? clientsResult.value : []);
        else problems.push('No se pudo cargar usuarios.');

        if (problems.length) setError(problems.join(' '));
        setLoading(false);
    }, []);
    useEffect(() => { void load(); }, [load]);
    function notify(text: string) { setMessage(text); window.setTimeout(() => setMessage(null), 3500); }
    function tab(value: Sub) { setSub(value); window.history.replaceState(null, '', `/admin?tab=${value}`); }
    const current = TABS.find((x) => x.value === sub);
    return <AppLayout breadcrumbs={breadcrumbs}><Head title="Administración — IngeTech AI" /><div className="min-h-full bg-slate-50/70 dark:bg-slate-950"><div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-7">
        <header className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-6 text-white shadow-xl sm:p-8"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold"><Database className="h-3.5 w-3.5 text-sky-300" /> Centro de control</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Administración</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Gestiona usuarios, equipos, software y datos que alimentan las recomendaciones de IngeTech AI.</p></div><button onClick={() => void load()} disabled={loading} className="it-btn rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Actualizar datos</button></div></header>
        {message && <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" />{message}<button className="ml-auto" onClick={() => setMessage(null)}><X className="h-4 w-4" /></button></div>}
        {error && <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"><AlertCircle className="h-5 w-5" />{error}<button onClick={() => void load()} className="ml-auto rounded-lg border px-3 py-1.5 text-xs font-bold">Reintentar</button></div>}
        <nav className="it-admin-card p-2"><div className="flex gap-1 overflow-x-auto">{TABS.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => tab(item.value)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${sub === item.value ? 'bg-[var(--it-primary)] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div></nav>
        {!catalogos || loading ? <LoadingPanel /> : sub === 'dashboard' ? <PanelDashboard dashboard={dashboard} carreras={catalogos.carreras} /> : sub === 'contabilidad' ? <PanelContabilidad datos={contabilidad} /> : sub === 'clientes' ? <UsersPanel clientes={clientes ?? []} onChange={load} notify={notify} /> : sub === 'hardware' ? <HardwarePanel items={Array.isArray(catalogos.hardware) ? catalogos.hardware : []} onChange={load} notify={notify} /> : sub === 'software' ? <SoftwarePanel items={Array.isArray(catalogos.software) ? catalogos.software : []} onChange={load} notify={notify} /> : <CareersPanel carreras={Array.isArray(catalogos.carreras) ? catalogos.carreras : []} software={Array.isArray(catalogos.software) ? catalogos.software : []} onChange={load} notify={notify} />}
        {current && <p className="pb-2 text-center text-xs text-slate-400">Sección actual: {current.label} · Los cambios se aplican al catálogo utilizado por el motor.</p>}
    </div></div></AppLayout>;
}

function HardwarePanel({ items, onChange, notify }: { items: Laptop[]; onChange: () => Promise<void>; notify: (s: string) => void }) {
    const [query, setQuery] = useState(''); const [editing, setEditing] = useState<Laptop | null>(null); const [saving, setSaving] = useState(false);
    const filtered = useMemo(() => items.filter((x) => `${x.marca} ${x.modelo} ${x.cpu} ${x.gpu}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
    async function save(item: Laptop) {
        setSaving(true);
        try {
            const serverImage = item.imagen_url?.startsWith('data:') ? null : (item.imagen_url ?? null);
            const payload = { marca: item.marca, modelo: item.modelo, descripcion: item.descripcion, tipo: item.tipo, cpu: item.cpu, rendimiento_score: Number(item.rendimiento_score), ram_gb: Number(item.ram_gb), ram_ampliable_gb: item.ram_ampliable_gb ? Number(item.ram_ampliable_gb) : null, almacenamiento_gb: Number(item.almacenamiento_gb), almacenamiento_tipo: item.almacenamiento_tipo, gpu: item.gpu, gpu_dedicada: item.gpu_dedicada, bateria_horas: item.bateria_horas ? Number(item.bateria_horas) : null, precio_soles: Number(item.precio_soles), tienda: item.tienda, imagen_url: serverImage };
            const result = item.id ? await api(`/api/admin/hardware/${item.id}`, 'PUT', payload) : await api('/api/admin/hardware', 'POST', payload);
            const savedId = extractSavedId(result, item.id);
            if (item.imagen_url?.startsWith('data:') && savedId) saveCatalogImage('hardware', savedId, item.imagen_url);
            else if (savedId && serverImage) saveCatalogImage('hardware', savedId, serverImage);
            notify(item.id ? 'Equipo actualizado correctamente.' : 'Equipo creado y listo para el catálogo.'); setEditing(null); await onChange();
        } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo guardar el equipo.'); } finally { setSaving(false); }
    }
    async function remove(item: Laptop) { if (!confirm(`¿Eliminar ${item.marca} ${item.modelo}?`)) return; try { await api(`/api/admin/hardware/${item.id}`, 'DELETE'); saveCatalogImage('hardware', item.id, null); notify('Equipo eliminado.'); await onChange(); } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo eliminar.'); } }
    return <section className="space-y-5"><CatalogHeader icon={<LaptopIcon className="h-5 w-5" />} title="Equipos" subtitle={`${items.length} equipos disponibles para catálogo y recomendaciones.`} button="Añadir equipo" onAdd={() => setEditing(emptyHardware())} query={query} setQuery={setQuery} />
        <div className="it-table-shell shadow-[0_16px_50px_rgba(15,23,42,.05)]"><div className="overflow-x-auto"><table className="it-table min-w-[1050px]"><thead><tr><th>Equipo</th><th>Rendimiento</th><th>Memoria</th><th>GPU</th><th>Precio</th><th className="text-right">Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="it-table-row"><td className="p-3"><div className="flex items-center gap-3"><ProductThumb src={getCatalogImage('hardware', item.id, item.imagen_url)} /><div><p className="font-bold">{item.marca} {item.modelo}</p><p className="text-xs text-slate-500">{item.tipo} · {item.cpu}</p></div></div></td><td className="p-3"><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">Score {item.rendimiento_score ?? 0}</span></td><td className="p-3 text-sm">{item.ram_gb} GB · {item.almacenamiento_gb} GB {item.almacenamiento_tipo}</td><td className="p-3 text-sm">{item.gpu_dedicada ? item.gpu : 'Integrada'}</td><td className="p-3 font-bold">S/ {Number(item.precio_soles).toLocaleString('es-PE')}</td><td className="p-3"><div className="flex justify-end gap-1"><button className="it-icon-btn" title="Editar" onClick={() => setEditing({ ...item })}><Edit3 className="h-4 w-4" /></button><button className="it-icon-btn text-rose-500 hover:bg-rose-50" title="Eliminar" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>{filtered.length === 0 && <Empty text="No encontramos equipos con esa búsqueda." />}</div>
        <Modal open={!!editing} title={editing?.id ? 'Editar equipo' : 'Añadir equipo'} description="La imagen principal se guarda en el registro y aparecerá en catálogo y recomendaciones." onClose={() => setEditing(null)} footer={<><button className="it-btn it-btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="it-btn it-btn-primary" disabled={saving} onClick={() => editing && void save(editing)}><Save className="h-4 w-4" />{saving ? 'Guardando...' : 'Guardar equipo'}</button></>}>{editing && <HardwareForm value={editing} onChange={setEditing} />}</Modal>
    </section>;
}

function HardwareForm({ value, onChange }: { value: Laptop; onChange: (v: Laptop) => void }) {
    const set = <K extends keyof Laptop>(key: K, val: Laptop[K]) => onChange({ ...value, [key]: val });
    return <div className="space-y-5"><ImagePicker value={value.imagen_url} onChange={(v) => set('imagen_url', v)} /><div className="it-form-grid"><label className="it-form-label">Marca<input className="it-form-input" value={value.marca} onChange={(e) => set('marca', e.target.value)} /></label><label className="it-form-label">Modelo<input className="it-form-input" value={value.modelo} onChange={(e) => set('modelo', e.target.value)} /></label><label className="it-form-label">Tipo<select className="it-form-input" value={value.tipo} onChange={(e) => set('tipo', e.target.value as Laptop['tipo'])}><option value="laptop">Laptop</option><option value="escritorio">Escritorio</option></select></label><label className="it-form-label">CPU<input className="it-form-input" value={value.cpu} onChange={(e) => set('cpu', e.target.value)} /></label><label className="it-form-label">RAM (GB)<input className="it-form-input" type="number" value={value.ram_gb} onChange={(e) => set('ram_gb', Number(e.target.value))} /></label><label className="it-form-label">RAM ampliable<input className="it-form-input" type="number" value={value.ram_ampliable_gb ?? ''} onChange={(e) => set('ram_ampliable_gb', e.target.value ? Number(e.target.value) : null)} /></label><label className="it-form-label">Almacenamiento (GB)<input className="it-form-input" type="number" value={value.almacenamiento_gb} onChange={(e) => set('almacenamiento_gb', Number(e.target.value))} /></label><label className="it-form-label">Tipo almacenamiento<input className="it-form-input" value={value.almacenamiento_tipo} onChange={(e) => set('almacenamiento_tipo', e.target.value)} /></label><label className="it-form-label">GPU<input className="it-form-input" value={value.gpu ?? ''} onChange={(e) => set('gpu', e.target.value)} /></label><label className="it-form-label">Score rendimiento<input className="it-form-input" type="number" value={value.rendimiento_score ?? 0} onChange={(e) => set('rendimiento_score', Number(e.target.value))} /></label><label className="it-form-label">Precio S/<input className="it-form-input" type="number" value={value.precio_soles} onChange={(e) => set('precio_soles', Number(e.target.value))} /></label><label className="it-form-label">Tienda<input className="it-form-input" value={value.tienda ?? ''} onChange={(e) => set('tienda', e.target.value)} /></label></div><div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={value.gpu_dedicada} onChange={(e) => set('gpu_dedicada', e.target.checked)} /> GPU dedicada</label><label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={!!value.bateria_horas} onChange={(e) => set('bateria_horas', e.target.checked ? 8 : null)} /> Tiene batería</label></div><label className="it-form-label">Descripción<textarea className="min-h-24 rounded-xl border bg-white p-3 text-sm outline-none focus:border-slate-400 dark:bg-slate-950" value={value.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} /></label></div>;
}

function SoftwarePanel({ items, onChange, notify }: { items: Software[]; onChange: () => Promise<void>; notify: (s: string) => void }) {
    const [query, setQuery] = useState(''); const [editing, setEditing] = useState<Software | null>(null); const [saving, setSaving] = useState(false);
    const filtered = useMemo(() => items.filter((x) => `${x.nombre} ${x.categoria} ${x.clave}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
    async function save(item: Software) {
        setSaving(true);
        try {
            const serverImage = item.imagen_url?.startsWith('data:') ? null : (item.imagen_url ?? null);
            const payload = { clave: item.clave, nombre: item.nombre, descripcion: item.descripcion, categoria: item.categoria, min_ram_gb: Number(item.min_ram_gb), min_cpu_score: Number(item.min_cpu_score), min_gpu_dedicada: item.min_gpu_dedicada, rec_ram_gb: Number(item.rec_ram_gb), rec_cpu_score: Number(item.rec_cpu_score), rec_gpu_dedicada: item.rec_gpu_dedicada, imagen_url: serverImage };
            const result = item.id ? await api(`/api/admin/software/${item.id}`, 'PUT', payload) : await api('/api/admin/software', 'POST', payload);
            const savedId = extractSavedId(result, item.id);
            if (item.imagen_url?.startsWith('data:') && savedId) saveCatalogImage('software', savedId, item.imagen_url);
            else if (savedId && serverImage) saveCatalogImage('software', savedId, serverImage);
            notify(item.id ? 'Software actualizado correctamente.' : 'Software creado y listo para el catálogo.'); setEditing(null); await onChange();
        } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo guardar el software.'); } finally { setSaving(false); }
    }
    async function remove(item: Software) { if (!confirm(`¿Eliminar ${item.nombre}?`)) return; try { await api(`/api/admin/software/${item.id}`, 'DELETE'); saveCatalogImage('software', item.id, null); notify('Software eliminado.'); await onChange(); } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo eliminar.'); } }
    return <section className="space-y-5"><CatalogHeader icon={<Package className="h-5 w-5" />} title="Software" subtitle={`${items.length} programas configurados para el motor de recomendación.`} button="Añadir software" onAdd={() => setEditing(emptySoftware())} query={query} setQuery={setQuery} /><div className="it-table-shell shadow-[0_16px_50px_rgba(15,23,42,.05)]"><div className="overflow-x-auto"><table className="it-table min-w-[980px]"><thead><tr><th>Software</th><th>Categoría</th><th>Mínimo</th><th>Recomendado</th><th className="text-right">Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="it-table-row"><td className="p-3"><div className="flex items-center gap-3"><ProductThumb src={getCatalogImage('software', item.id, item.imagen_url)} /><div><p className="font-bold">{item.nombre}</p><p className="text-xs text-slate-500">{item.clave}</p></div></div></td><td className="p-3"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">{item.categoria}</span></td><td className="p-3 text-sm">{item.min_ram_gb} GB · CPU {item.min_cpu_score}{item.min_gpu_dedicada ? ' · GPU' : ''}</td><td className="p-3 text-sm font-semibold">{item.rec_ram_gb} GB · CPU {item.rec_cpu_score}{item.rec_gpu_dedicada ? ' · GPU' : ''}</td><td className="p-3"><div className="flex justify-end gap-1"><button className="it-icon-btn" onClick={() => setEditing({ ...item })}><Edit3 className="h-4 w-4" /></button><button className="it-icon-btn text-rose-500 hover:bg-rose-50" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>{filtered.length === 0 && <Empty text="No encontramos software con esa búsqueda." />}</div><Modal open={!!editing} title={editing?.id ? 'Editar software' : 'Añadir software'} description="Define sus requisitos para que el motor pueda considerarlo en las recomendaciones." onClose={() => setEditing(null)} footer={<><button className="it-btn it-btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="it-btn it-btn-primary" disabled={saving} onClick={() => editing && void save(editing)}><Save className="h-4 w-4" />{saving ? 'Guardando...' : 'Guardar software'}</button></>}>{editing && <SoftwareForm value={editing} onChange={setEditing} />}</Modal></section>;
}

function SoftwareForm({ value, onChange }: { value: Software; onChange: (v: Software) => void }) {
    const set = <K extends keyof Software>(key: K, val: Software[K]) => onChange({ ...value, [key]: val });
    return <div className="space-y-5"><ImagePicker value={value.imagen_url} onChange={(v) => set('imagen_url', v)} label="Imagen / icono del software" /><div className="it-form-grid"><label className="it-form-label">Clave<input className="it-form-input" value={value.clave} onChange={(e) => set('clave', e.target.value)} /></label><label className="it-form-label">Nombre<input className="it-form-input" value={value.nombre} onChange={(e) => set('nombre', e.target.value)} /></label><label className="it-form-label">Categoría<input className="it-form-input" value={value.categoria} onChange={(e) => set('categoria', e.target.value)} /></label><label className="it-form-label">RAM mínima<input className="it-form-input" type="number" value={value.min_ram_gb} onChange={(e) => set('min_ram_gb', Number(e.target.value))} /></label><label className="it-form-label">CPU mínima<input className="it-form-input" type="number" value={value.min_cpu_score} onChange={(e) => set('min_cpu_score', Number(e.target.value))} /></label><label className="it-form-label">RAM recomendada<input className="it-form-input" type="number" value={value.rec_ram_gb} onChange={(e) => set('rec_ram_gb', Number(e.target.value))} /></label><label className="it-form-label">CPU recomendada<input className="it-form-input" type="number" value={value.rec_cpu_score} onChange={(e) => set('rec_cpu_score', Number(e.target.value))} /></label></div><div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={value.min_gpu_dedicada} onChange={(e) => set('min_gpu_dedicada', e.target.checked)} /> GPU mínima</label><label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={value.rec_gpu_dedicada} onChange={(e) => set('rec_gpu_dedicada', e.target.checked)} /> GPU recomendada</label></div><label className="it-form-label">Descripción<textarea className="min-h-24 rounded-xl border bg-white p-3 text-sm outline-none focus:border-slate-400 dark:bg-slate-950" value={value.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} /></label></div>;
}

function UsersPanel({ clientes, onChange, notify }: { clientes: Cliente[]; onChange: () => Promise<void>; notify: (s: string) => void }) {
    const [query, setQuery] = useState(''); const [selected, setSelected] = useState<Cliente | null>(null);
    const filtered = useMemo(() => clientes.filter((x) => `${x.name} ${x.email}`.toLowerCase().includes(query.toLowerCase())), [clientes, query]);
    async function role(user: Cliente, value: boolean) { try { await api(`/api/admin/clientes/${user.id}/rol`, 'PATCH', { is_admin: value }); notify(value ? 'Usuario promovido a administrador.' : 'Permisos de administrador retirados.'); setSelected(null); await onChange(); } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo cambiar el rol.'); } }
    async function remove(user: Cliente) { if (!confirm(`¿Eliminar a ${user.name}?`)) return; try { await api(`/api/admin/clientes/${user.id}`, 'DELETE'); notify('Usuario eliminado.'); setSelected(null); await onChange(); } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo eliminar.'); } }
    return <section className="space-y-5"><CatalogHeader icon={<Users className="h-5 w-5" />} title="Usuarios" subtitle={`${clientes.length} personas registradas en la plataforma.`} query={query} setQuery={setQuery} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((user) => <article key={user.id} className="it-admin-card group relative overflow-hidden border-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800"><div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-500/5 blur-2xl" /><div className="relative flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--it-primary-soft)] font-bold text-[var(--it-primary)]">{user.name.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-bold">{user.name}</h3>{user.is_admin && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">ADMIN</span>}</div><p className="truncate text-sm text-slate-500">{user.email}</p></div></div><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><b>{user.perfiles_count}</b><span className="ml-1 text-slate-500">perfiles</span></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><b>{new Date(user.created_at).toLocaleDateString('es-PE')}</b><span className="ml-1 text-slate-500">registro</span></div></div><button className="it-btn it-btn-secondary mt-4 w-full" onClick={() => setSelected(user)}><Eye className="h-4 w-4" /> Gestionar usuario</button></article>)}</div>{filtered.length === 0 && <Empty text="No encontramos usuarios." />}<Modal open={!!selected} title="Gestionar usuario" description="Administra el rol o elimina esta cuenta." onClose={() => setSelected(null)} footer={<button className="it-btn it-btn-secondary" onClick={() => setSelected(null)}>Cerrar</button>}>{selected && <div className="space-y-4"><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cuenta</p><h3 className="mt-2 text-xl font-bold">{selected.name}</h3><p className="mt-1 text-sm text-slate-500">{selected.email}</p></div><div className="grid gap-3 sm:grid-cols-2"><button className="it-btn border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" onClick={() => void role(selected, !selected.is_admin)}><Shield className="h-4 w-4" />{selected.is_admin ? 'Quitar administrador' : 'Dar administrador'}</button><button className="it-btn border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => void remove(selected)}><Trash2 className="h-4 w-4" /> Eliminar usuario</button></div></div>}</Modal></section>;
}

function CareersPanel({ carreras, software, onChange, notify }: { carreras: Carrera[]; software: Software[]; onChange: () => Promise<void>; notify: (s: string) => void }) {
    const [rows, setRows] = useState((carreras as (Carrera & { software_claves?: string })[]).map((x) => ({ ...x, software_claves: x.software_claves ?? x.software.map((s) => s.clave).join(', ') })));
    const [query, setQuery] = useState('');
    useEffect(() => setRows((carreras as (Carrera & { software_claves?: string })[]).map((x) => ({ ...x, software_claves: x.software_claves ?? x.software.map((s) => s.clave).join(', ') }))), [carreras]);
    const filtered = rows.filter((x) => `${x.nombre} ${x.facultad}`.toLowerCase().includes(query.toLowerCase()));
    async function save() { try { for (const x of rows) await api(`/api/admin/carreras/${x.id}`, 'PUT', { clave: x.clave, nombre: x.nombre, facultad: x.facultad, software_claves: x.software_claves }); notify('Carreras actualizadas.'); await onChange(); } catch (e) { notify(e instanceof Error ? e.message : 'No se pudieron guardar las carreras.'); } }
    async function remove(id: number) { if (!confirm('¿Eliminar esta carrera?')) return; try { await api(`/api/admin/carreras/${id}`, 'DELETE'); notify('Carrera eliminada.'); await onChange(); } catch (e) { notify(e instanceof Error ? e.message : 'No se pudo eliminar.'); } }
    return <section className="space-y-5"><CatalogHeader icon={<GraduationCap className="h-5 w-5" />} title="Carreras" subtitle="Relaciona software con las necesidades académicas." query={query} setQuery={setQuery} /><div className="it-table-shell shadow-[0_16px_50px_rgba(15,23,42,.05)]"><div className="overflow-x-auto"><table className="it-table min-w-[900px]"><thead><tr><th>Carrera</th><th>Facultad</th><th>Software</th><th className="text-right">Acción</th></tr></thead><tbody>{filtered.map((x) => { const index = rows.findIndex((r) => r.id === x.id); return <tr key={x.id} className="it-table-row"><td className="p-3"><input className="it-form-input w-72" value={x.nombre} onChange={(e) => setRows((old) => old.map((r, i) => i === index ? { ...r, nombre: e.target.value } : r))} /></td><td className="p-3"><input className="it-form-input w-56" value={x.facultad} onChange={(e) => setRows((old) => old.map((r, i) => i === index ? { ...r, facultad: e.target.value } : r))} /></td><td className="p-3"><input className="it-form-input w-full min-w-80" value={x.software_claves} onChange={(e) => setRows((old) => old.map((r, i) => i === index ? { ...r, software_claves: e.target.value } : r))} /></td><td className="p-3"><button className="it-icon-btn text-rose-500" onClick={() => void remove(x.id)}><Trash2 className="h-4 w-4" /></button></td></tr>; })}</tbody></table></div><div className="flex items-center justify-between border-t p-4 dark:border-slate-800"><span className="text-xs text-slate-500">Claves disponibles: {software.map((x) => x.clave).join(', ')}</span><button className="it-btn it-btn-primary" onClick={() => void save()}><Save className="h-4 w-4" /> Guardar cambios</button></div></div></section>;
}

function CatalogHeader({ icon, title, subtitle, button, onAdd, query, setQuery }: { icon: ReactNode; title: string; subtitle: string; button?: string; onAdd?: () => void; query: string; setQuery: (v: string) => void }) {
    return <div className="it-admin-card"><div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)]">{icon}</div><div><h2 className="text-xl font-bold">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="it-form-input w-full pl-10 sm:w-80" placeholder={`Buscar ${title.toLowerCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} /></div>{button && onAdd && <button className="it-btn it-btn-primary" onClick={onAdd}><Plus className="h-4 w-4" />{button}</button>}</div></div></div>;
}
function ProductThumb({ src }: { src?: string | null }) { return <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-950">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}</div>; }
function Empty({ text }: { text: string }) { return <div className="it-admin-card py-14 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-500">{text}</p></div>; }
