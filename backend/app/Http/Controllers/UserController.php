<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('role')->withCount(['leads', 'clients', 'activities']);

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(fn ($q) => $q
                ->whereRaw("CONCAT(first_name,' ',last_name) LIKE ?", ["%{$term}%"])
                ->orWhere('email', 'LIKE', "%{$term}%")
            );
        }
        if ($request->filled('role_id'))   $query->where('role_id', $request->role_id);
        if ($request->filled('is_active')) $query->where('is_active', $request->boolean('is_active'));

        $paginator = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($paginator),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with('role')->findOrFail($id);
        return response()->json(['success' => true, 'data' => new UserResource($user)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:8',
            'role_id'    => 'required|exists:roles,id',
            'phone'      => 'nullable|string|max:30',
        ]);

        $user = User::create(array_merge($data, [
            'password'          => Hash::make($data['password']),
            'is_active'         => true,
            'email_verified_at' => now(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data'    => new UserResource($user->load('role')),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name'  => 'sometimes|required|string|max:100',
            'email'      => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($id)],
            'role_id'    => 'sometimes|required|exists:roles,id',
            'phone'      => 'nullable|string|max:30',
            'is_active'  => 'sometimes|boolean',
        ]);

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data'    => new UserResource($user->fresh('role')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'User deleted successfully.']);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'User activated.' : 'User deactivated.',
            'data'    => new UserResource($user->fresh('role')),
        ]);
    }
}
