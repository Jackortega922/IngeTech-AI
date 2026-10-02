import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

type Props = {
    itemId: number | string;
    primary?: string | null;
    onPrimaryChange: (url: string) => void;
    compact?: boolean;
};

function keyFor(id: number | string) {
    return `ingetech:gallery:${id}`;
}

function readFile(file: File) {
    return new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        r.readAsDataURL(file);
    });
}

export default function ProductGallery({ itemId, primary, onPrimaryChange, compact = false }: Props) {
    const input = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<string[]>([]);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(keyFor(itemId)) || '[]');
            if (Array.isArray(saved) && saved.length) setImages(saved);
            else if (primary) setImages([primary]);
        } catch {
            /* ignore malformed local storage */
        }
    }, [itemId, primary]);

    useEffect(() => {
        if (!images.length) return;
        try {
            localStorage.setItem(keyFor(itemId), JSON.stringify(images.slice(0, 8)));
        } catch {
            /* quota exceeded */
        }
        if (!primary || !images.includes(primary)) onPrimaryChange(images[0]);
    }, [images]);

    const current = images[index] || primary || null;

    async function add(e: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []).slice(0, 8 - images.length);
        const urls = await Promise.all(files.map(readFile));
        setImages((old) => [...old, ...urls].slice(0, 8));
        e.target.value = '';
    }

    function remove(i: number) {
        setImages((old) => {
            const next = old.filter((_, n) => n !== i);
            if (index >= next.length) setIndex(Math.max(0, next.length - 1));
            if (i === 0 && next[0]) onPrimaryChange(next[0]);
            return next;
        });
    }

    function makePrimary(url: string) {
        onPrimaryChange(url);
        setImages((old) => [url, ...old.filter((x) => x !== url)]);
        setIndex(0);
    }

    const size = compact ? 'h-14 w-16' : 'h-28 w-full';
    return (
        <div className={compact ? 'w-20 shrink-0' : 'w-full'}>
            <div className={`group relative overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-950 ${size}`}>
                {current ? (
                    <img src={current} alt="Vista del producto" className="h-full w-full object-cover" />
                ) : (
                    <button
                        type="button"
                        onClick={() => input.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 hover:text-sky-500"
                    >
                        <ImagePlus className="h-5 w-5" />
                        {!compact && <span className="text-[10px] font-semibold">Agregar fotos</span>}
                    </button>
                )}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                            className="absolute top-1/2 left-1 -translate-y-1/2 rounded-full bg-black/55 p-1 text-white"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIndex((i) => (i + 1) % images.length)}
                            className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full bg-black/55 p-1 text-white"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </>
                )}
                {current && (
                    <div className="absolute right-1 bottom-1 left-1 flex justify-between">
                        <button
                            type="button"
                            title="Usar como imagen principal"
                            onClick={() => makePrimary(current)}
                            className="rounded-full bg-black/55 p-1 text-white"
                        >
                            <Star className="h-3 w-3" />
                        </button>
                        <button
                            type="button"
                            title="Eliminar foto"
                            onClick={() => remove(index)}
                            className="rounded-full bg-red-500/80 p-1 text-white"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>
            {!compact && (
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto">
                    {images.map((url, i) => (
                        <button
                            key={`${url}-${i}`}
                            type="button"
                            onClick={() => setIndex(i)}
                            className={`h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? 'border-sky-500' : 'border-transparent'}`}
                        >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                    ))}
                    {images.length < 8 && (
                        <button
                            type="button"
                            onClick={() => input.current?.click()}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-dashed text-slate-400 hover:border-sky-400 hover:text-sky-500"
                        >
                            <ImagePlus className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={add} />
        </div>
    );
}
