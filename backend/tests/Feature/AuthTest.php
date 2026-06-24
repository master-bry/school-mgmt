<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    private function createSchool(): School
    {
        return School::create([
            'name' => 'Test School',
            'email' => 'test@school.tz',
            'phone' => '+255-712-000000',
            'code' => 'TST001',
            'is_active' => 1,
        ]);
    }

    private function createUser(string $role, string $email = 'test@shulesmart.tz'): User
    {
        $school = $this->createSchool();
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
        $this->createUser('admin', 'admin@test.tz');

        $response = $this->postJson('/api/login', [
            'email' => 'admin@test.tz',
            'password' => 'Secret@2026',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_login_with_invalid_password_returns_401()
    {
        $this->createUser('admin', 'admin@test.tz');

        $response = $this->postJson('/api/login', [
            'email' => 'admin@test.tz',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_with_nonexistent_email_returns_422()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@test.tz',
            'password' => 'Secret@2026',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_access_profile()
    {
        $user = $this->createUser('teacher', 'teacher@test.tz');

        $login = $this->postJson('/api/login', [
            'email' => 'teacher@test.tz',
            'password' => 'Secret@2026',
        ]);

        $token = $login->json('token');

        $response = $this->withHeader('Authorization', "Bearer $token")
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
        $user = $this->createUser('student', 'student@test.tz');

        $login = $this->postJson('/api/login', [
            'email' => 'student@test.tz',
            'password' => 'Secret@2026',
        ]);

        $token = $login->json('token');

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/super-admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_role_dashboard_access()
    {
        $roles = [
            'super_admin' => '/api/super-admin/dashboard',
            'admin' => '/api/admin/dashboard',
            'teacher' => '/api/teacher/dashboard',
            'student' => '/api/student/dashboard',
            'parent' => '/api/parent/dashboard',
            'academician' => '/api/academician/dashboard',
            'cashier' => '/api/cashier/dashboard',
            'head_of_school' => '/api/head-of-school/dashboard',
        ];

        $emails = [];
        $school = $this->createSchool();
        foreach (array_keys($roles) as $role) {
            $email = "{$role}@test.tz";
            $emails[$role] = $email;
            User::create([
                'school_id' => $school->id,
                'name' => ucfirst($role),
                'email' => $email,
                'password' => Hash::make('Secret@2026'),
                'role' => $role,
                'phone' => '+255-712-000001',
                'is_active' => 1,
            ]);
        }

        foreach ($roles as $role => $url) {
            $login = $this->postJson('/api/login', [
                'email' => $emails[$role],
                'password' => 'Secret@2026',
            ]);

            $response = $this->withHeader('Authorization', "Bearer {$login->json('token')}")
                ->getJson($url);
            $response->assertStatus(200);
        }
    }
}
