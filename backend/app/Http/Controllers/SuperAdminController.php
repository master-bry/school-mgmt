<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\School;
use App\Models\Fee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SuperAdminController extends Controller
{
    public function dashboard()
    {
        $totalSchools = School::count();
        $activeSchools = School::where('is_active', true)->count();
        $totalUsers = User::count();
        $totalStudents = User::where('role', 'student')->count();
        $totalTeachers = User::where('role', 'teacher')->count();
        $totalRevenue = Fee::sum('paid_amount');
        $pendingRevenue = Fee::whereIn('status', ['pending', 'partial', 'overdue'])->sum('amount');

        $schoolsByPlan = School::selectRaw("subscription_plan, count(*) as count")
            ->whereNotNull('subscription_plan')
            ->groupBy('subscription_plan')
            ->pluck('count', 'subscription_plan');

        $recentSchools = School::latest()->take(5)->get();
        $recentUsers = User::with('school')->latest()->take(10)->get();

        $monthlyRegistrations = School::selectRaw("to_char(created_at, 'YYYY-MM') as month, count(*) as count")
            ->groupBy('month')->orderBy('month', 'desc')->take(12)->get();

        return response()->json([
            'total_schools' => $totalSchools,
            'active_schools' => $activeSchools,
            'total_users' => $totalUsers,
            'total_students' => $totalStudents,
            'total_teachers' => $totalTeachers,
            'total_revenue' => $totalRevenue,
            'pending_revenue' => $pendingRevenue,
            'schools_by_plan' => $schoolsByPlan,
            'recent_schools' => $recentSchools,
            'recent_users' => $recentUsers,
            'monthly_registrations' => $monthlyRegistrations,
        ]);
    }

    // ─── Tenant (School) Management ─────────────────────────────────

    public function schools()
    {
        $schools = School::withCount('users')->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($schools);
    }

    public function storeSchool(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'subscription_plan' => 'nullable|string|in:free,starter,growth,enterprise',
            'subscription_status' => 'nullable|string|in:active,trial,expired,suspended,cancelled',
        ]);

        $code = strtoupper(substr($request->name, 0, 3)) . rand(1000, 9999);

        $school = School::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'code' => $code,
            'is_active' => true,
            'subscription_plan' => $request->subscription_plan ?? 'free',
            'subscription_status' => $request->subscription_status ?? 'trial',
            'subscription_starts_at' => now(),
            'subscription_ends_at' => now()->addDays(30),
        ]);

        return response()->json($school, 201);
    }

    public function showSchool($id)
    {
        $school = School::withCount('users')->with(['users' => function ($q) {
            $q->select('id', 'school_id', 'name', 'email', 'role', 'is_active', 'created_at');
        }])->findOrFail($id);

        return response()->json($school);
    }

    public function updateSchool(Request $request, $id)
    {
        $school = School::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'subscription_plan' => 'sometimes|string|in:free,starter,growth,enterprise',
            'subscription_status' => 'sometimes|string|in:active,trial,expired,suspended,cancelled',
        ]);

        $school->update($request->only([
            'name', 'email', 'phone', 'address', 'is_active',
            'subscription_plan', 'subscription_status',
        ]));

        $school->fresh()->syncUserStatus();

        return response()->json($school->fresh());
    }

    public function suspendSchool($id)
    {
        $school = School::findOrFail($id);
        $school->update([
            'is_active' => false,
            'subscription_status' => 'suspended',
        ]);
        User::where('school_id', $id)->update(['is_active' => false]);

        return response()->json(['message' => 'School suspended successfully']);
    }

    // ─── School User CRUD ─────────────────────────────────────────

    public function storeSchoolUser(Request $request, $id)
    {
        $school = School::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,teacher,student,parent,academician,cashier,head_of_school,assistant_head,secretary',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'school_id' => $school->id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function updateSchoolUser(Request $request, $schoolId, $userId)
    {
        $school = School::findOrFail($schoolId);
        $user = User::where('school_id', $school->id)->findOrFail($userId);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$userId,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:admin,teacher,student,parent,academician,cashier,head_of_school,assistant_head,secretary',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $data = $request->only(['name', 'email', 'role', 'phone', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        return response()->json($user->fresh());
    }

    public function deleteSchoolUser($schoolId, $userId)
    {
        $school = School::findOrFail($schoolId);
        $user = User::where('school_id', $school->id)->findOrFail($userId);
        $user->delete();
        return response()->json(null, 204);
    }

    // ─── Billing & Subscription ─────────────────────────────────────

    public function subscriptions()
    {
        $schools = School::whereNotNull('subscription_plan')
            ->orderBy('subscription_ends_at', 'asc')
            ->get(['id', 'name', 'code', 'subscription_plan', 'subscription_status', 'subscription_starts_at', 'subscription_ends_at', 'is_active']);

        return response()->json($schools);
    }

    public function updateSubscription(Request $request, $id)
    {
        $school = School::findOrFail($id);

        $request->validate([
            'subscription_plan' => 'required|string|in:free,starter,growth,enterprise',
            'subscription_status' => 'required|string|in:active,trial,expired,suspended,cancelled',
            'subscription_ends_at' => 'nullable|date',
        ]);

        $data = $request->only(['subscription_plan', 'subscription_status']);
        if ($request->subscription_ends_at) {
            $data['subscription_ends_at'] = $request->subscription_ends_at;
        }
        if (in_array($request->subscription_status, ['active', 'trial'])) {
            $data['is_active'] = true;
        }

        $school->update($data);

        $school->fresh()->syncUserStatus();

        return response()->json($school->fresh());
    }

    // ─── Feature Flags ──────────────────────────────────────────────

    public function featureFlags()
    {
        $flags = \App\Models\FeatureFlag::orderBy('feature_key')->get();
        return response()->json($flags);
    }

    public function updateFeatureFlag(Request $request, $id)
    {
        $flag = \App\Models\FeatureFlag::findOrFail($id);

        $request->validate([
            'is_enabled' => 'required|boolean',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $flag->update([
            'is_enabled' => $request->is_enabled,
            'school_id' => $request->school_id,
        ]);

        return response()->json($flag->fresh());
    }

    public function storeFeatureFlag(Request $request)
    {
        $request->validate([
            'feature_key' => 'required|string|max:100|unique:feature_flags,feature_key',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_enabled' => 'boolean',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $flag = \App\Models\FeatureFlag::create([
            'feature_key' => $request->feature_key,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'is_enabled' => $request->is_enabled ?? false,
            'school_id' => $request->school_id,
        ]);

        return response()->json($flag, 201);
    }

    // ─── Per-School Feature Assignment ─────────────────────────────

    public function schoolFeatures($id)
    {
        $school = School::findOrFail($id);
        $config = $school->config ?? [];
        $schoolFeatures = $config['features'] ?? [];

        $globalFlags = \App\Models\FeatureFlag::whereNull('school_id')
            ->orderBy('feature_key')
            ->get(['feature_key', 'display_name', 'description', 'is_enabled']);

        return $globalFlags->map(function ($flag) use ($schoolFeatures) {
            $overridden = array_key_exists($flag->feature_key, $schoolFeatures);
            return [
                'feature_key' => $flag->feature_key,
                'display_name' => $flag->display_name,
                'description' => $flag->description,
                'enabled' => $overridden ? (bool) $schoolFeatures[$flag->feature_key] : $flag->is_enabled,
                'overridden' => $overridden,
            ];
        });
    }

    public function toggleSchoolFeature(Request $request, $id)
    {
        $school = School::findOrFail($id);

        $request->validate([
            'feature_key' => 'required|string|max:100',
            'is_enabled' => 'required|boolean',
        ]);

        $config = $school->config ?? [];
        $features = $config['features'] ?? [];
        $features[$request->feature_key] = $request->is_enabled;
        $config['features'] = $features;
        $school->update(['config' => $config]);

        return response()->json([
            'feature_key' => $request->feature_key,
            'enabled' => $request->is_enabled,
        ]);
    }

    // ─── Cross-Tenant Analytics ─────────────────────────────────────

    public function analytics()
    {
        $totalSchools = School::count();
        $activeSchools = School::where('is_active', true)->count();
        $totalStudents = User::where('role', 'student')->count();
        $totalTeachers = User::where('role', 'teacher')->count();
        $totalParents = User::where('role', 'parent')->count();
        $totalStaff = User::whereIn('role', [
            'admin', 'academician', 'cashier', 'head_of_school', 'assistant_head', 'secretary',
        ])->count();

        $roleDistribution = User::selectRaw("role, count(*) as count")
            ->groupBy('role')->orderBy('count', 'desc')->get();

        $totalRevenue = Fee::sum('paid_amount');
        $pendingRevenue = Fee::whereIn('status', ['pending', 'partial', 'overdue'])->sum('amount');

        $schoolsWithRevenue = School::withCount([
            'users as student_count' => fn($q) => $q->where('role', 'student'),
        ])->withSum('fees as total_collected', 'paid_amount')
            ->orderBy('total_collected', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'overview' => [
                'total_schools' => $totalSchools,
                'active_schools' => $activeSchools,
                'total_students' => $totalStudents,
                'total_teachers' => $totalTeachers,
                'total_parents' => $totalParents,
                'total_staff' => $totalStaff,
            ],
            'role_distribution' => $roleDistribution,
            'revenue' => [
                'total_collected' => $totalRevenue,
                'total_pending' => $pendingRevenue,
            ],
            'top_schools' => $schoolsWithRevenue,
        ]);
    }
}
