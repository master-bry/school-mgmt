<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    private function createUser(string $role): User
    {
        $school = School::create([
            'name' => 'Test School',
            'email' => 'sch_' . uniqid() . '@test.tz',
            'phone' => '+255-712-000000',
            'code' => 'SCH_' . uniqid(),
            'is_active' => 1,
        ]);
        $email = $role . '_' . uniqid() . '@test.tz';
        return User::create([
            'school_id' => $school->id,
            'name' => ucfirst($role),
            'email' => $email,
            'password' => Hash::make('Secret@2026'),
            'role' => $role,
            'phone' => '+255-712-000001',
            'is_active' => 1,
        ]);
    }

    public function test_login_with_valid_credentials_returns_token()
    {
        $user = $this->createUser('admin');

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Secret@2026',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_login_with_invalid_password_returns_422()
    {
        $user = $this->createUser('admin');

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_with_nonexistent_email_returns_422()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody_' . uniqid() . '@test.tz',
            'password' => 'Secret@2026',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_access_profile()
    {
        $user = $this->createUser('teacher');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonPath('role', 'teacher');
    }

    public function test_unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }

    public function test_role_middleware_blocks_wrong_role()
    {
        $user = $this->createUser('student');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/super-admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_super_admin_dashboard()
    {
        $user = $this->createUser('super_admin');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/super-admin/dashboard');
        $response->assertStatus(200);
    }

    public function test_admin_dashboard()
    {
        $user = $this->createUser('admin');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/dashboard');
        $response->assertStatus(200);
    }

    public function test_teacher_dashboard()
    {
        $user = $this->createUser('teacher');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/teacher/dashboard');
        $response->assertStatus(200);
    }

    public function test_student_dashboard()
    {
        $user = $this->createUser('student');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/student/dashboard');
        $response->assertStatus(200);
    }

    public function test_parent_dashboard()
    {
        $user = $this->createUser('parent');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/parent/dashboard');
        $response->assertStatus(200);
    }

    public function test_academician_dashboard()
    {
        $user = $this->createUser('academician');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/academician/dashboard');
        $response->assertStatus(200);
    }

    public function test_cashier_dashboard()
    {
        $user = $this->createUser('cashier');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/cashier/dashboard');
        $response->assertStatus(200);
    }

    public function test_head_of_school_dashboard()
    {
        $user = $this->createUser('head_of_school');
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/head-of-school/dashboard');
        $response->assertStatus(200);
    }
}
