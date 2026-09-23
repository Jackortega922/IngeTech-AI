<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;

class ClienteController extends Controller
{
    public function index()
    {
        $clientes = User::withCount('perfiles')
            ->where('is_admin', false)
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'email', 'created_at']);

        return response()->json($clientes);
    }
}
