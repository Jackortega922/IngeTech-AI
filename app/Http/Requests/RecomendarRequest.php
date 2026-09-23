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
            'perfil' => ['required', 'array'],
            'perfil.carrera_clave' => ['required', 'string', Rule::exists('carreras', 'clave')],
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
