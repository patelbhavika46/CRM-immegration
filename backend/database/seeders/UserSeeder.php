<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('slug', 'super_admin')->first();
        $adminRole      = Role::where('slug', 'admin')->first();
        $consultantRole = Role::where('slug', 'consultant')->first();

        User::firstOrCreate(['email' => 'superadmin@crm.local'], [
            'role_id'          => $superAdminRole->id,
            'first_name'       => 'Super',
            'last_name'        => 'Admin',
            'password'         => Hash::make('Password@123'),
            'is_active'        => true,
            'email_verified_at'=> now(),
        ]);

        User::firstOrCreate(['email' => 'admin@crm.local'], [
            'role_id'          => $adminRole->id,
            'first_name'       => 'System',
            'last_name'        => 'Admin',
            'password'         => Hash::make('Password@123'),
            'is_active'        => true,
            'email_verified_at'=> now(),
        ]);

        User::firstOrCreate(['email' => 'consultant@crm.local'], [
            'role_id'          => $consultantRole->id,
            'first_name'       => 'Jane',
            'last_name'        => 'Doe',
            'password'         => Hash::make('Password@123'),
            'is_active'        => true,
            'email_verified_at'=> now(),
        ]);
    }
}
