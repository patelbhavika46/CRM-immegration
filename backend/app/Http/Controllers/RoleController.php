<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Role::all()]);
    }

    public function show(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        return response()->json(['success' => true, 'data' => $role]);
    }
}
