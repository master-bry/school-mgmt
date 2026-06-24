<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@ems.com',
            'password' => Hash::make('Secret@2026'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Teacher User',
            'email' => 'teacher@ems.com',
            'password' => Hash::make('Secret@2026'),
            'role' => 'teacher',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Student User',
            'email' => 'student@ems.com',
            'password' => Hash::make('Secret@2026'),
            'role' => 'student',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Parent User',
            'email' => 'parent@ems.com',
            'password' => Hash::make('Secret@2026'),
            'role' => 'parent',
            'is_active' => true,
        ]);
    }
}
