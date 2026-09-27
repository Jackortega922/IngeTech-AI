<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'perfil.carrera_clave' => ['required', 'string', Rule::exists('carreras', 'clave')],
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
}
