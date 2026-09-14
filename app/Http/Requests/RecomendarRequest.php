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

        $this->merge(['opciones' => $opciones]);
    }

    public function rules(): array
    {
        return [
            'perfil' => ['required', 'array'],
            'perfil.carrera' => ['nullable', 'string'],
            'perfil.nivel_experiencia' => ['required', Rule::in(['basico', 'intermedio', 'avanzado'])],
            'perfil.actividades' => ['required', 'array', 'min:1'],
            'perfil.actividades.*' => ['string'],
            'perfil.software' => ['array'],
            'perfil.software.*' => ['string'],
            'perfil.presupuesto_soles' => ['required', 'numeric', 'gt:0'],
            'opciones' => ['array'],
            'opciones.top_n' => ['integer', 'between:1,10'],
        ];
    }
}
