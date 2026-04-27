<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials): ?array
    {
        $token = auth()->attempt([
            'email'    => $credentials['email'],
            'password' => $credentials['password'],
        ]);

        if (!$token) {
            return null;
        }

        $user = auth()->user();

        if (!$user->is_active) {
            auth()->logout();
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Contact administrator.'],
            ]);
        }

        $user->update(['last_login_at' => now()]);

        return [
            'token'      => $token,
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user'       => $user->load('role'),
        ];
    }

    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['avatar']) && $data['avatar']->isValid()) {
            $data['avatar_path'] = $data['avatar']->store('avatars', 's3');
            unset($data['avatar']);
        }

        $user->update($data);

        return $user->fresh('role');
    }

    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($data['new_password'])]);
    }

    public function sendPasswordResetLink(string $email): void
    {
        Password::sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $data): void
    {
        $status = Password::reset($data, function (User $user, string $password) {
            $user->update(['password' => Hash::make($password)]);
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired password reset token.'],
            ]);
        }
    }
}
