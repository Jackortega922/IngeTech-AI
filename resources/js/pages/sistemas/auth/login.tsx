import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = { email: string; password: string; remember: boolean };

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const avatarStyles = [
    'bg-gradient-to-br from-sky-300 to-blue-600',
    'bg-gradient-to-br from-violet-300 to-indigo-600',
    'bg-gradient-to-br from-emerald-300 to-teal-600',
    'bg-gradient-to-br from-amber-200 to-orange-500',
];

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({ email: '', password: '', remember: false });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Bienvenido de nuevo" description="Accede a tu espacio y continúa con tu recomendación personalizada.">
            <Head title="Ingresar · IngeTech AI" />
            <div className="mb-7 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                <div className="flex items-center gap-3">
                    <div className="relative flex -space-x-2">
                        {avatarStyles.map((style, i) => (
                            <span
                                key={style}
                                className={`it-avatar-orbit grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm dark:border-slate-900 ${style}`}
                            >
                                {['M', 'A', 'J', 'I'][i]}
                            </span>
                        ))}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0c2340] dark:text-white">Una experiencia pensada para ti</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Perfiles, recomendaciones y catálogo en un solo lugar.</p>
                    </div>
                    <Sparkles className="ml-auto h-4 w-4 shrink-0 text-sky-500" />
                </div>
            </div>

            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="tu-correo@ejemplo.com"
                            className="it-auth-input pl-10"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="text-xs font-semibold">
                                ¿Olvidaste tu contraseña?
                            </TextLink>
                        )}
                    </div>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="it-auth-input pr-11 pl-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                            <span className="sr-only">Mostrar contraseña</span>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Checkbox checked={data.remember} onCheckedChange={(checked) => setData('remember', checked === true)} />
                    <span>Recordarme en este dispositivo</span>
                </label>

                <button type="submit" disabled={processing} className="it-login-button">
                    {processing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    {processing ? 'Ingresando…' : 'Ingresar a IngeTech AI'}
                </button>
            </form>

            {status && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}
            <div className="mt-7 border-t pt-6 text-center dark:border-slate-800">
                <p className="text-sm text-slate-500">¿Todavía no tienes una cuenta?</p>
                <TextLink href={route('register')} className="mt-1 inline-block font-bold">
                    Crear mi cuenta
                </TextLink>
            </div>
        </AuthLayout>
    );
}
