<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'leads'         => ['view', 'create', 'edit', 'delete', 'convert', 'assign'],
            'clients'       => ['view', 'create', 'edit', 'delete'],
            'applicants'    => ['view', 'create', 'edit', 'delete'],
            'opportunities' => ['view', 'create', 'edit', 'delete'],
            'activities'    => ['view', 'create', 'edit', 'delete'],
            'documents'     => ['view', 'upload', 'delete'],
            'payments'      => ['view', 'create', 'refund'],
            'reports'       => ['view'],
            'users'         => ['view', 'manage'],
            'roles'         => ['manage'],
            'integrations'  => ['view', 'manage'],
        ];

        $allPermissions = [];
        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $allPermissions[] = Permission::firstOrCreate(
                    ['slug' => "{$module}.{$action}"],
                    ['name' => ucfirst($action) . ' ' . ucfirst($module), 'module' => $module],
                );
            }
        }

        $roles = [
            'super_admin' => ['name' => 'Super Admin',  'permissions' => $allPermissions],
            'admin'       => ['name' => 'Admin',        'permissions' => array_filter($allPermissions, fn ($p) => !str_starts_with($p->slug, 'roles.'))],
            'manager'     => ['name' => 'Manager',      'permissions' => array_filter($allPermissions, fn ($p) => !in_array($p->slug, ['users.manage', 'roles.manage', 'integrations.manage']))],
            'consultant'  => ['name' => 'Consultant',   'permissions' => array_filter($allPermissions, fn ($p) => in_array($p->module, ['leads', 'clients', 'applicants', 'activities', 'documents']) && $p->slug !== 'leads.delete')],
        ];

        foreach ($roles as $slug => $config) {
            $role = Role::firstOrCreate(['slug' => $slug], ['name' => $config['name']]);
            $role->permissions()->sync(collect($config['permissions'])->pluck('id'));
        }
    }
}
