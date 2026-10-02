<?php

namespace App\Http\Requests;

use App\Models\PerfilUsuario;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RecomendarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $opciones = $this->input('opciones', []);
        $opciones['top_n'] = $opciones['top_n'] ?? 3;

        $perfil = $this->input('perfil', []);
        $perfil['actividades'] = $perfil['actividades'] ?? [];

        $this->merge(['opciones' => $opciones, 'perfil' => $perfil]);
    }

    public function rules(): array
    {
        return [
            // Se exige aquí y no solo en la casilla del formulario: quien llame a la API
            // directamente, sin pasar por la página, tampoco puede saltárselo.
            'consentimiento' => ['accepted'],
            'perfil' => ['required', 'array'],
            // Opcional: el público general no siempre tiene carrera. Si la indica, sus programas
            // típicos se precargan en el formulario.
            'perfil.carrera_clave' => ['nullable', 'string', Rule::exists('carreras', 'clave')],
            'perfil.tipo_uso' => ['nullable', Rule::in(PerfilUsuario::TIPOS_USO)],
            // Programas que la persona dice usar (claves del catálogo). Si no se envía, se usan
            // los típicos de su carrera.
            'perfil.software' => ['array'],
            'perfil.software.*' => ['string', 'distinct', Rule::exists('software', 'clave')],
            // Informativo, no alimenta el motor: dato del cliente para el panel admin y
            // Marketing/Contabilidad (E5, E6). Libre porque los cargos del público general no
            // caben en un catálogo cerrado como sí cabe la carrera/ocupación.
            'perfil.cargo' => ['nullable', 'string', 'max:100'],
            'perfil.nivel_experiencia' => ['required', Rule::in(['basico', 'intermedio', 'avanzado'])],
            'perfil.actividades' => ['array'],
            'perfil.actividades.*' => ['string', Rule::exists('actividades', 'clave')],
            'perfil.presupuesto_soles' => ['required', 'numeric', 'gt:0'],
            'perfil.portabilidad' => ['required', Rule::in(['laptop', 'escritorio', 'cualquiera'])],
            'opciones' => ['array'],
            'opciones.top_n' => ['integer', 'between:1,10'],
        ];
    }

    /**
     * El motor necesita saber qué hará la persona: al menos un programa o una actividad. Si no
     * envía la lista de programas, valen los de su carrera.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $perfil = $this->input('perfil', []);
                $usaCarrera = ! array_key_exists('software', $perfil) && ! empty($perfil['carrera_clave']);

                if (empty($perfil['actividades']) && empty($perfil['software']) && ! $usaCarrera) {
                    $validator->errors()->add('perfil.software', 'Elige al menos un programa que uses o una actividad que hagas.');
                }
            },
        ];
    }
}
