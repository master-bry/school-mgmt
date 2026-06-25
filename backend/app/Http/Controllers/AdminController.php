<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\School;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Fee;
use App\Models\Attendance;
use App\Models\Grade;
use App\Models\GradeSubmission;
use App\Models\Blog;
use App\Models\Event;
use App\Models\Book;
use App\Models\Exam;
use App\Models\Timetable;
use App\Models\Announcement;
use App\Models\AcademicResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    use \App\Models\Traits\ParentEnrichment;

    private function schoolUsers()
    {
        return User::where('school_id', auth()->user()->school_id);
    }

    public function dashboard()
    {
        $schoolId = auth()->user()->school_id;
        $school = School::find($schoolId);

        // Tenant & Subscription Analytics
        $totalActiveUsers = User::where('school_id', $schoolId)->where('is_active', true)->count();
        $roleCounts = User::where('school_id', $schoolId)
            ->selectRaw("role, count(*) as count")
            ->groupBy('role')
            ->pluck('count', 'role');

        $userCounts = [
            'students' => $roleCounts->get('student', 0),
            'teachers' => $roleCounts->get('teacher', 0),
            'parents' => $roleCounts->get('parent', 0),
            'academicians' => $roleCounts->get('academician', 0),
            'cashiers' => $roleCounts->get('cashier', 0),
            'staff' => ($roleCounts->get('head_of_school', 0) + $roleCounts->get('assistant_head', 0) + $roleCounts->get('secretary', 0)),
        ];

        // Detailed RBAC matrix
        $rolesBreakdown = User::where('school_id', $schoolId)
            ->selectRaw("role, count(*) as count, sum(case when is_active = 1 then 1 else 0 end) as active")
            ->groupBy('role')
            ->get();

        // Audit trail (recent user activity)
        $recentUsers = User::where('school_id', $schoolId)->with('class')
            ->latest()->take(10)->get();

        // Backup & system health mock data
        $systemHealth = [
            'database_size' => '2.4 GB',
            'last_backup' => now()->subHours(2)->format('Y-m-d H:i:s'),
            'backup_status' => 'healthy',
            'cloud_sync' => 'synced',
            'uptime_percentage' => 99.97,
            'active_sessions' => $totalActiveUsers,
        ];

        // API / Integration stats
        $apiKeys = [
            ['name' => 'Biometric Device - Main', 'key' => substr(md5('bio1'), 0, 16) . '...', 'last_used' => now()->subHour()->format('Y-m-d H:i'), 'status' => 'active'],
            ['name' => 'SMS Gateway', 'key' => substr(md5('sms1'), 0, 16) . '...', 'last_used' => now()->subDays(2)->format('Y-m-d H:i'), 'status' => 'active'],
            ['name' => 'Payment Gateway', 'key' => substr(md5('pay1'), 0, 16) . '...', 'last_used' => now()->subMinutes(30)->format('Y-m-d H:i'), 'status' => 'active'],
        ];

        // Fee/license analytics
        $totalFeesCollected = Fee::where('school_id', $schoolId)->sum('paid_amount');
        $totalFeesPending = Fee::where('school_id', $schoolId)->whereIn('status', ['pending', 'partial', 'overdue'])->sum('amount');

        return response()->json([
            'school' => $school,
            'total_users' => $totalActiveUsers,
            'user_counts' => $userCounts,
            'roles_breakdown' => $rolesBreakdown,
            'total_classes' => ClassModel::where('school_id', $schoolId)->count(),
            'total_subjects' => Subject::where('school_id', $schoolId)->count(),
            'recent_users' => $recentUsers,
            'system_health' => $systemHealth,
            'api_keys' => $apiKeys,
            'financial_summary' => [
                'total_collected' => $totalFeesCollected,
                'total_pending' => $totalFeesPending,
                'total_invoices' => Fee::where('school_id', $schoolId)->count(),
            ],
        ]);
    }

    // ─── RBAC Management ───────────────────────────────────────────
    public function rbacMatrix()
    {
        $schoolId = $this->schoolUsers()->first()->school_id;
        $users = User::where('school_id', $schoolId)->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);
        $roles = User::where('school_id', $schoolId)
            ->selectRaw("role, count(*) as count, sum(case when is_active = 1 then 1 else 0 end) as active")
            ->groupBy('role')->get();
        return response()->json(['users' => $users, 'roles' => $roles]);
    }

    // ─── Audit Trail ───────────────────────────────────────────────
    public function auditTrail()
    {
        $schoolId = auth()->user()->school_id;
        $logs = AuditLog::where('school_id', $schoolId)
            ->with('user:id,name,email,role')
            ->latest()
            ->take(50)
            ->get();
        return response()->json($logs);
    }

    // ─── Standard CRUD ─────────────────────────────────────────────
    public function index()
    {
        $users = $this->schoolUsers()->with('class', 'school', 'parent')
            ->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,teacher,student,parent,academician,cashier,head_of_school,assistant_head,secretary',
            'class_id' => 'nullable|exists:classes,id',
            'parent_id' => 'nullable|exists:users,id',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
        ]);

        $user = User::create([
            'school_id' => auth()->user()->school_id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'class_id' => $request->class_id,
            'parent_id' => $request->parent_id,
            'phone' => $request->phone,
            'address' => $request->address,
            'date_of_birth' => $request->date_of_birth,
        ]);

        return response()->json($user->load('class', 'school'), 201);
    }

    public function show($id)
    {
        $user = $this->schoolUsers()->with('class', 'school', 'parent', 'children')->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = $this->schoolUsers()->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$id,
            'role' => 'sometimes|required|in:admin,teacher,student,parent,academician,cashier,head_of_school,assistant_head,secretary',
            'password' => 'sometimes|required|string|min:8',
            'class_id' => 'nullable|exists:classes,id',
            'parent_id' => 'nullable|exists:users,id',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $data = $request->only(['name', 'email', 'role', 'class_id', 'parent_id', 'phone', 'address', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        return response()->json($user->fresh()->load('class', 'school'));
    }

    public function destroy($id)
    {
        $user = $this->schoolUsers()->findOrFail($id);
        $user->delete();
        return response()->json(null, 204);
    }

    // ─── Parents ─────────────────────────────────────────────────
    public function getParents()
    {
        $data = $this->enrichedParents(auth()->user()->school_id);
        return response()->json([
            'parents' => $data,
            'total' => $data->count(),
        ]);
    }
}
