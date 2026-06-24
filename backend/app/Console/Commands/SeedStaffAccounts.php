<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\School;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SeedStaffAccounts extends Command
{
    protected $signature = 'seed:staff';
    protected $description = 'Seed staff accounts (HOS, academician, cashier, etc.)';

    public function handle()
    {
        $school = School::first();
        if (!$school) {
            $this->error('No school found. Run DatabaseSeeder first.');
            return 1;
        }

        $password = 'Secret@2026';
        $domain = '@ems.com';
        $accounts = [
            ['name' => 'System Admin',     'email' => 'user',         'role' => 'admin'],
            ['name' => 'John Teacher',     'email' => 'teacher',      'role' => 'teacher'],
            ['name' => 'Jane Student',     'email' => 'student',      'role' => 'student'],
            ['name' => 'Paul Parent',      'email' => 'parent',       'role' => 'parent'],
            ['name' => 'Dr. Sarah Academic','email' => 'academician',  'role' => 'academician'],
            ['name' => 'Mike Cashier',     'email' => 'cashier',      'role' => 'cashier'],
            ['name' => 'Principal Adams',  'email' => 'head',         'role' => 'head_of_school'],
            ['name' => 'Vice Principal Brown','email' => 'assistant', 'role' => 'assistant_head'],
            ['name' => 'Lucy Secretary',   'email' => 'secretary',    'role' => 'secretary'],
        ];

        $count = 0;
        foreach ($accounts as $data) {
            $email = $data['email'] . $domain;
            $existing = User::withTrashed()->where('email', $email)->first();
            if ($existing) {
                if ($existing->trashed()) {
                    $existing->restore();
                    $existing->update(['password' => Hash::make($password), 'is_active' => true]);
                    $this->info("Restored {$email} ({$data['role']})");
                } else {
                    $this->warn("SKIP {$email} — already exists");
                }
                $count++;
                continue;
            }
            User::create([
                'school_id' => $school->id,
                'name' => $data['name'],
                'email' => $email,
                'password' => Hash::make($password),
                'role' => $data['role'],
                'is_active' => true,
            ]);
            $this->info("Created {$email} ({$data['role']})");
            $count++;
        }

        // Link student to parent if both exist
        $student = User::withTrashed()->where('email', 'student' . $domain)->first();
        $parent = User::withTrashed()->where('email', 'parent' . $domain)->first();
        if ($student && $parent && !$student->parent_id) {
            $student->parent_id = $parent->id;
            $student->save();
            $this->info('Linked student → parent');
        }

        $this->info("Done. {$count} account(s) created.");
        return 0;
    }
}
