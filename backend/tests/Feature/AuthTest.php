<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    public function test_super_admin_can_login()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'super@shulesmart.tz',
            'password' => 'Secret@2026',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_invalid_credentials_return_401()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'super@shulesmart.tz',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_student_can_login()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'student@shulesmart.tz',
            'password' => 'Secret@2026',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'student');
    }

    public function test_authenticated_user_can_access_profile()
    {
        $login = $this->postJson('/api/login', [
            'email' => 'teacher@shulesmart.tz',
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
        $login = $this->postJson('/api/login', [
            'email' => 'student@shulesmart.tz',
            'password' => 'Secret@2026',
        ]);

        $token = $login->json('token');

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/super-admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_all_roles_can_access_their_dashboard()
    {
        $roles = [
            'super@shulesmart.tz' => '/api/super-admin/dashboard',
            'admin@shulesmart.tz' => '/api/admin/dashboard',
            'teacher@shulesmart.tz' => '/api/teacher/dashboard',
            'student@shulesmart.tz' => '/api/student/dashboard',
            'parent@shulesmart.tz' => '/api/parent/dashboard',
            'academician@shulesmart.tz' => '/api/academician/dashboard',
            'cashier@shulesmart.tz' => '/api/cashier/dashboard',
            'head@shulesmart.tz' => '/api/head-of-school/dashboard',
        ];

        foreach ($roles as $email => $url) {
            $login = $this->postJson('/api/login', [
                'email' => $email,
                'password' => 'Secret@2026',
            ]);

            $this->assertAuthenticated();

            $response = $this->withHeader('Authorization', "Bearer {$login->json('token')}")
                ->getJson($url);
            $response->assertStatus(200);
        }
    }
}
