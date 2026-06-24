<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\School;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Exam;
use App\Models\Grade;
use App\Models\GradeSubmission;
use App\Models\Fee;
use App\Models\Attendance;
use App\Models\Timetable;
use App\Models\Transcript;
use App\Models\Approval;
use App\Models\StudentDetail;
use App\Exports\StudentImportTemplateExport;
use App\Imports\StudentsImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HeadOfSchoolController extends Controller
{
    use \App\Models\Traits\ParentEnrichment;

    private function schoolId() { return auth()->user()->school_id; }

    public function dashboard()
    {
        $schoolId = $this->schoolId();
        $today = today()->toDateString();

        // Query 1: all aggregate counts in one round trip
        $agg = DB::selectOne("
            SELECT
              (SELECT count(*) FROM users WHERE school_id = ? AND role = 'student')                                                              AS total_students,
              (SELECT count(*) FROM users WHERE school_id = ? AND role = 'student' AND is_active)                                              AS active_students,
              (SELECT count(*) FROM users WHERE school_id = ? AND role = 'teacher')                                                            AS total_teachers,
              (SELECT count(*) FROM users WHERE school_id = ? AND role = 'academician')                                                        AS academicians,
              (SELECT count(*) FROM users WHERE school_id = ? AND role IN ('cashier','secretary'))                                             AS support_staff,
              (SELECT count(*) FROM classes WHERE school_id = ?)                                                                               AS total_classes,
              (SELECT count(*) FROM subjects WHERE school_id = ?)                                                                              AS total_subjects,
              (SELECT coalesce(sum(paid_amount),0) FROM fees WHERE school_id = ?)                                                              AS fees_collected,
              (SELECT coalesce(sum(amount),0) FROM fees WHERE school_id = ?)                                                                   AS fees_budget,
              (SELECT count(*) FROM grade_submissions WHERE school_id = ? AND status IN ('forwarded','pending','reviewed'))                    AS pending_approvals,
              (SELECT count(*) FROM attendances WHERE school_id = ? AND date = ?::date)                                                        AS attend_total,
              (SELECT count(*) FROM attendances WHERE school_id = ? AND date = ?::date AND status = 'present')                                AS attend_present,
              (SELECT count(*) FROM attendances WHERE school_id = ? AND date = ?::date AND status = 'absent')                                 AS attend_absent
        ", [
            $schoolId, $schoolId, $schoolId, $schoolId, $schoolId,
            $schoolId, $schoolId, $schoolId, $schoolId, $schoolId,
            $schoolId, $today, $schoolId, $today, $schoolId, $today
        ]);

        $retentionRate = $agg->total_students > 0
            ? round(($agg->active_students / $agg->total_students) * 100, 1) : 0;
        $budgetUtilization = $agg->fees_budget > 0
            ? round(($agg->fees_collected / $agg->fees_budget) * 100, 1) : 0;
        $attendanceRate = $agg->attend_total > 0
            ? round(($agg->attend_present / $agg->attend_total) * 100, 1) : 0;

        // Query 2: class enrollment + avg grades + attendance by class
        $classes = DB::select("
            SELECT
              c.id, c.name,
              (SELECT count(*) FROM users WHERE school_id = ? AND role = 'student' AND class_id = c.id) AS students_count
            FROM classes c WHERE c.school_id = ?
            ORDER BY c.name
        ", [$schoolId, $schoolId]);

        $classIds = array_column($classes, 'id');

        if ($classIds) {
            $avgGrades = DB::select("
                SELECT e.class_id, avg(g.percentage) as avg
                FROM grades g
                JOIN exams e ON e.id = g.exam_id
                WHERE g.school_id = ? AND e.class_id IN (" . implode(',', array_fill(0, count($classIds), '?')) . ")
                GROUP BY e.class_id
            ", array_merge([$schoolId], $classIds));
            $avgGrades = collect($avgGrades)->pluck('avg', 'class_id');

            $attCounts = DB::select("
                SELECT u.class_id,
                       count(*) as total,
                       sum(case when a.status = 'present' then 1 else 0 end) as present
                FROM attendances a
                JOIN users u ON u.id = a.student_id
                WHERE a.school_id = ? AND u.class_id IN (" . implode(',', array_fill(0, count($classIds), '?')) . ")
                GROUP BY u.class_id
            ", array_merge([$schoolId], $classIds));
            $attCounts = collect($attCounts)->keyBy('class_id');
        } else {
            $avgGrades = collect();
            $attCounts = collect();
        }

        $enrollmentFunnel = [];
        $classPerformance = [];
        foreach ($classes as $c) {
            $enrollmentFunnel[] = ['id' => $c->id, 'name' => $c->name, 'students_count' => $c->students_count];
            $attC = $attCounts->get($c->id);
            $classPerformance[] = [
                'name'             => $c->name,
                'students_count'   => $c->students_count,
                'avg_grade'        => round($avgGrades->get($c->id, 0), 1),
                'attendance_rate'  => $attC ? round(($attC->present / max(1, $attC->total)) * 100, 1) : 0,
            ];
        }

        // Query 3: recent users
        $recentUsers = User::where('school_id', $schoolId)
            ->latest()->take(5)->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'total_students'    => $agg->total_students,
            'total_teachers'    => $agg->total_teachers,
            'total_classes'     => $agg->total_classes,
            'total_subjects'    => $agg->total_subjects,
            'total_staff'       => $agg->total_teachers + $agg->academicians + $agg->support_staff,
            'enrollment_funnel' => $enrollmentFunnel,
            'retention_rate'    => $retentionRate,
            'staff_capacity'    => [
                'teachers'     => $agg->total_teachers,
                'academicians' => $agg->academicians,
                'support'      => $agg->support_staff,
            ],
            'financial_health'  => [
                'total_collected'    => $agg->fees_collected,
                'total_budget'       => $agg->fees_budget,
                'budget_utilization' => $budgetUtilization,
                'outstanding'        => $agg->fees_budget - $agg->fees_collected,
            ],
            'operations'        => [
                'today_present'    => $agg->attend_present,
                'today_absent'     => $agg->attend_absent,
                'today_total'      => $agg->attend_total,
                'attendance_rate'  => $attendanceRate,
            ],
            'pending_approvals' => $agg->pending_approvals,
            'class_performance' => $classPerformance,
            'recent_users'      => $recentUsers,
        ]);
    }

    public function staff()
    {
        return response()->json(
            User::where('school_id', $this->schoolId())
                ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
                ->with('teacherDetail')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'phone', 'address', 'gender', 'national_id', 'marital_status', 'employee_code', 'date_of_birth', 'is_active', 'created_at'])
        );
    }

    public function pendingApprovals()
    {
        return response()->json(
            GradeSubmission::where('school_id', $this->schoolId())
                ->whereIn('status', ['forwarded', 'pending', 'reviewed'])
                ->with(['exam.subject', 'class', 'submittedBy', 'reviewedBy'])->get()
        );
    }

    public function approveResults(Request $request, $id)
    {
        $submission = GradeSubmission::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate(['status' => 'required|in:approved,rejected', 'approval_notes' => 'nullable|string']);
        $submission->update(['status' => $data['status'], 'approved_by' => auth()->id(), 'approved_at' => now(), 'approval_notes' => $data['approval_notes'] ?? null]);
        if ($data['status'] === 'approved') {
            Grade::where('exam_id', $submission->exam_id)->update(['submission_status' => 'approved', 'approved_by' => auth()->id(), 'approved_at' => now()]);
        }
        return response()->json(['message' => 'Results ' . $data['status'], 'submission' => $submission->fresh()]);
    }

    public function analytics()
    {
        $schoolId = $this->schoolId();

        $studentsPerClass = ClassModel::where('school_id', $schoolId)->withCount('students')->get(['id', 'name']);

        $attendanceByClass = ClassModel::where('school_id', $schoolId)
            ->withCount(['students', 'attendances as present_count' => fn($q) => $q->where('status', 'present')])
            ->get(['id', 'name']);

        $feeCompletionRate = Fee::where('school_id', $schoolId)
            ->selectRaw("count(*) as total, sum(case when status='paid' then 1 else 0 end) as paid_count")
            ->first();

        $subjectPerformance = DB::table('subjects')
            ->join('exams', 'exams.subject_id', '=', 'subjects.id')
            ->join('grades', 'grades.exam_id', '=', 'exams.id')
            ->where('subjects.school_id', $schoolId)
            ->selectRaw("subjects.id, subjects.name, avg(grades.percentage) as average_score")
            ->groupBy('subjects.id', 'subjects.name')
            ->get();

        return response()->json([
            'students_per_class' => $studentsPerClass,
            'attendance_by_class' => $attendanceByClass,
            'fee_completion_rate' => $feeCompletionRate,
            'subject_performance' => $subjectPerformance,
        ]);
    }

    // ─── Transcript Approval ────────────────────────────────────
    public function pendingTranscripts()
    {
        return response()->json(
            Transcript::with(['student', 'class', 'createdBy'])
                ->where('school_id', $this->schoolId())
                ->where('status', 'pending_approval')
                ->orderBy('submitted_at', 'asc')
                ->get()
        );
    }

    public function approveTranscript(Request $request, $id)
    {
        $transcript = Transcript::where('school_id', $this->schoolId())->findOrFail($id);
        if ($transcript->status !== 'pending_approval') {
            return response()->json(['message' => 'Transcript is not pending approval'], 422);
        }
        $data = $request->validate(['head_notes' => 'nullable|string']);
        $transcript->update([
            'status' => 'approved',
            'head_approved_by' => auth()->id(),
            'head_approved_at' => now(),
            'head_notes' => $data['head_notes'] ?? null,
        ]);
        return response()->json(['message' => 'Transcript approved', 'transcript' => $transcript->fresh()->load(['student', 'class', 'subjects.subject', 'headApprovedBy'])]);
    }

    public function rejectTranscript(Request $request, $id)
    {
        $transcript = Transcript::where('school_id', $this->schoolId())->findOrFail($id);
        if ($transcript->status !== 'pending_approval') {
            return response()->json(['message' => 'Transcript is not pending approval'], 422);
        }
        $data = $request->validate(['head_notes' => 'nullable|string']);
        $transcript->update([
            'status' => 'draft',
            'head_notes' => $data['head_notes'] ?? null,
        ]);
        return response()->json(['message' => 'Transcript rejected, returned to draft', 'transcript' => $transcript->fresh()]);
    }

    // ─── Student Management ──────────────────────────────────────
    public function getStudents(Request $request)
    {
        $query = User::where('school_id', $this->schoolId())->where('role', 'student')->with('class', 'section', 'parent', 'studentDetail');
        if ($request->class_id) $query->where('class_id', $request->class_id);
        if ($request->status) $query->where('status', $request->status);
        if ($request->search) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")->orWhere('admission_number', 'like', "%{$s}%"));
        }
        return response()->json($query->orderBy('name')->get([
            'id', 'name', 'email', 'class_id', 'section_id', 'grade', 'parent_id', 'phone', 'address',
            'date_of_birth', 'gender', 'national_id', 'religion', 'nationality',
            'blood_group', 'admission_number', 'enrollment_date', 'previous_school',
            'sport_house', 'transport_route', 'status', 'is_active', 'created_at',
        ]));
    }

    public function getStudentMember($id)
    {
        $student = User::where('school_id', $this->schoolId())->where('role', 'student')
            ->with('class', 'section', 'studentDetail', 'parent', 'approvals')
            ->findOrFail($id);
        return response()->json($student);
    }

    public function getParents()
    {
        $data = $this->enrichedParents($this->schoolId());
        return response()->json([
            'parents' => $data,
            'total' => $data->count(),
        ]);
    }

    public function storeSingleStudent(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:100',
            'religion' => 'nullable|string|max:100',
            'nationality' => 'nullable|string|max:100',
            'blood_group' => 'nullable|string|max:10',
            'admission_number' => 'nullable|string|max:100',
            'enrollment_date' => 'nullable|date',
            'previous_school' => 'nullable|string|max:255',
            'sport_house' => 'nullable|string|max:100',
            'transport_route' => 'nullable|string|max:255',
            'class_id' => 'nullable|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'grade' => 'nullable|string|max:100',
            'parent_name' => 'nullable|string|max:255',
            'parent_phone' => 'nullable|string|max:20',
            'parent_email' => 'nullable|email|unique:users,email',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|email',
            'guardian_relationship' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'medical_info' => 'nullable|string',
            'allergies' => 'nullable|string',
        ]);

        $password = $data['password'] ?? Str::random(8);
        $student = User::create([
            'school_id' => $this->schoolId(),
            'name' => trim($data['first_name'] . ' ' . $data['last_name']),
            'email' => $data['email'],
            'password' => Hash::make($password),
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'national_id' => $data['national_id'] ?? null,
            'religion' => $data['religion'] ?? null,
            'nationality' => $data['nationality'] ?? null,
            'blood_group' => $data['blood_group'] ?? null,
            'admission_number' => $data['admission_number'] ?? null,
            'enrollment_date' => $data['enrollment_date'] ?? null,
            'previous_school' => $data['previous_school'] ?? null,
            'sport_house' => $data['sport_house'] ?? null,
            'transport_route' => $data['transport_route'] ?? null,
            'role' => 'student',
            'class_id' => $data['class_id'] ?? null,
            'section_id' => $data['section_id'] ?? null,
            'grade' => $data['grade'] ?? null,
            'status' => User::STATUS_ACTIVE,
        ]);

        $student->studentDetail()->create([
            'guardian_name' => $data['guardian_name'] ?? null,
            'guardian_phone' => $data['guardian_phone'] ?? null,
            'guardian_email' => $data['guardian_email'] ?? null,
            'guardian_relationship' => $data['guardian_relationship'] ?? null,
            'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
            'emergency_contact_relationship' => $data['emergency_contact_relationship'] ?? null,
            'medical_info' => $data['medical_info'] ?? null,
            'allergies' => $data['allergies'] ?? null,
        ]);

        if (!empty($data['parent_email'])) {
            $parentPassword = Str::random(8);
            $parent = User::create([
                'school_id' => $this->schoolId(),
                'name' => $data['parent_name'] ?? 'Parent of ' . $student->name,
                'email' => $data['parent_email'],
                'password' => Hash::make($parentPassword),
                'phone' => $data['parent_phone'] ?? null,
                'role' => 'parent',
            ]);
            $student->parent_id = $parent->id;
            $student->save();
        }

        return response()->json([
            'student' => $student->fresh()->load('class', 'section', 'parent', 'studentDetail'),
            'credentials' => ['email' => $data['email'], 'password' => $password],
            'parent_credentials' => isset($parent) ? ['email' => $data['parent_email'], 'password' => $parentPassword] : null,
        ], 201);
    }

    public function exportStudentTemplate()
    {
        return Excel::download(new StudentImportTemplateExport(), 'student-import-template.xlsx');
    }

    public function importStudents(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv']);
        $import = new StudentsImport($this->schoolId());
        Excel::import($import, $request->file('file'));
        return response()->json([
            'imported' => $import->imported,
            'parent_accounts' => $import->parentMap,
            'errors' => $import->errors,
            'total_imported' => count($import->imported),
            'total_errors' => count($import->errors),
        ]);
    }

    public function updateStudentStatus(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|string|in:' . implode(',', User::studentStatuses()),
        ]);
        $student = User::where('school_id', $this->schoolId())->where('role', 'student')->findOrFail($id);
        $activeStatuses = [User::STATUS_ACTIVE, User::STATUS_PROBATION, User::STATUS_ON_LEAVE];
        $student->update([
            'status' => $data['status'],
            'is_active' => in_array($data['status'], $activeStatuses),
        ]);
        return response()->json(['message' => 'Student status updated', 'student' => $student->fresh()->load('class', 'section', 'parent', 'studentDetail')]);
    }

    public function updateStudent(Request $request, $id)
    {
        $student = User::where('school_id', $this->schoolId())->where('role', 'student')->findOrFail($id);
        $userData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:100',
            'religion' => 'nullable|string|max:100',
            'nationality' => 'nullable|string|max:100',
            'blood_group' => 'nullable|string|max:10',
            'admission_number' => 'nullable|string|max:100',
            'enrollment_date' => 'nullable|date',
            'previous_school' => 'nullable|string|max:255',
            'sport_house' => 'nullable|string|max:100',
            'transport_route' => 'nullable|string|max:255',
            'class_id' => 'nullable|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'grade' => 'nullable|string|max:100',
        ]);
        $student->update($userData);

        $detailData = $request->validate([
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|email',
            'guardian_relationship' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'medical_info' => 'nullable|string',
            'allergies' => 'nullable|string',
        ]);
        if ($student->studentDetail) {
            $student->studentDetail->update($detailData);
        } else {
            $student->studentDetail()->create($detailData);
        }

        return response()->json($student->fresh()->load('class', 'section', 'parent', 'studentDetail'));
    }

    public function getClasses()
    {
        return response()->json(ClassModel::where('school_id', $this->schoolId())->get(['id', 'name', 'section', 'capacity']));
    }

    // ─── Unified Staff Management (teacher, academician, cashier, secretary) ───
    public function getStaff()
    {
        return response()->json(
            User::where('school_id', $this->schoolId())
                ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
                ->with('teacherDetail')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'phone', 'address', 'gender', 'national_id', 'marital_status', 'employee_code', 'date_of_birth', 'is_active', 'created_at'])
        );
    }

    public function getStaffMember($id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
            ->with('teacherDetail.salaryApprovedBy', 'teacherDetail.bonusApprovedBy', 'approvals.requester')
            ->findOrFail($id);
        return response()->json($staff);
    }

    public function storeStaff(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:teacher,academician,cashier,secretary',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'gender' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:100',
            'religion' => 'nullable|string|max:100',
            'nationality' => 'nullable|string|max:100',
            'blood_group' => 'nullable|string|max:10',
            'marital_status' => 'nullable|string|max:50',
            'employee_code' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'employment_type' => 'nullable|in:full-time,part-time,contract,intern',
            'department' => 'nullable|string|max:255',
            'qualification' => 'nullable|string',
            'years_experience' => 'nullable|integer',
            'previous_employer' => 'nullable|string|max:255',
            'date_joined' => 'nullable|date',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'emergency_relationship' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:100',
            'bank_code' => 'nullable|string|max:50',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'salary' => 'nullable|numeric|min:0',
        ]);

        $user = User::create([
            'school_id' => $this->schoolId(),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'gender' => $data['gender'] ?? null,
            'national_id' => $data['national_id'] ?? null,
            'religion' => $data['religion'] ?? null,
            'nationality' => $data['nationality'] ?? null,
            'blood_group' => $data['blood_group'] ?? null,
            'marital_status' => $data['marital_status'] ?? null,
            'employee_code' => $data['employee_code'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'role' => $data['role'],
        ]);

        $user->teacherDetail()->create([
            'salary' => $data['salary'] ?? null,
            'employment_type' => $data['employment_type'] ?? null,
            'department' => $data['department'] ?? null,
            'qualification' => $data['qualification'] ?? null,
            'years_experience' => $data['years_experience'] ?? null,
            'previous_employer' => $data['previous_employer'] ?? null,
            'date_joined' => $data['date_joined'] ?? null,
            'emergency_contact' => $data['emergency_contact'] ?? null,
            'emergency_phone' => $data['emergency_phone'] ?? null,
            'emergency_relationship' => $data['emergency_relationship'] ?? null,
            'bank_name' => $data['bank_name'] ?? null,
            'bank_account' => $data['bank_account'] ?? null,
            'bank_code' => $data['bank_code'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json($user->fresh()->load('teacherDetail'), 201);
    }

    public function updateStaff(Request $request, $id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
            ->findOrFail($id);

        $userData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'gender' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:100',
            'religion' => 'nullable|string|max:100',
            'nationality' => 'nullable|string|max:100',
            'blood_group' => 'nullable|string|max:10',
            'marital_status' => 'nullable|string|max:50',
            'employee_code' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
        ]);
        $staff->update($userData);

        $detailData = $request->validate([
            'salary' => 'nullable|numeric|min:0',
            'employment_type' => 'nullable|in:full-time,part-time,contract,intern',
            'department' => 'nullable|string|max:255',
            'qualification' => 'nullable|string',
            'years_experience' => 'nullable|integer',
            'previous_employer' => 'nullable|string|max:255',
            'date_joined' => 'nullable|date',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'emergency_relationship' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:100',
            'bank_code' => 'nullable|string|max:50',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($staff->teacherDetail) {
            $staff->teacherDetail->update($detailData);
        } else {
            $staff->teacherDetail()->create($detailData);
        }

        return response()->json($staff->fresh()->load('teacherDetail'));
    }

    public function deleteStaff($id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
            ->findOrFail($id);
        $staff->delete();
        return response()->json(['message' => 'Staff member deleted']);
    }

    public function approveStaffSalary(Request $request, $id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
            ->findOrFail($id);
        $detail = $staff->teacherDetail;
        if (!$detail) return response()->json(['message' => 'No staff details found'], 404);
        $detail->update(['salary_approved_by' => auth()->id()]);
        return response()->json(['message' => 'Salary approved', 'detail' => $detail->fresh()->load('salaryApprovedBy')]);
    }

    public function approveStaffBonus(Request $request, $id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
            ->findOrFail($id);
        $detail = $staff->teacherDetail;
        if (!$detail) return response()->json(['message' => 'No staff details found'], 404);
        $detail->update(['bonus_approved_by' => auth()->id()]);
        return response()->json(['message' => 'Bonus approved', 'detail' => $detail->fresh()->load('bonusApprovedBy')]);
    }

    // ─── Staff Status Update ──────────────────────────────────────
    public function updateStaffStatus(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|string|in:' . implode(',', User::staffStatuses()),
        ]);
        $staff = User::where('school_id', $this->schoolId())
            ->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])
            ->findOrFail($id);
        $activeStatuses = [User::STATUS_ACTIVE, User::STATUS_PROBATION, User::STATUS_ON_LEAVE];
        $staff->update([
            'status' => $data['status'],
            'is_active' => in_array($data['status'], $activeStatuses),
        ]);
        return response()->json(['message' => 'Staff status updated', 'staff' => $staff->fresh()->load('teacherDetail')]);
    }

    // ─── Unified Approvals (permission, results, salary, bonus, transcript, transfer, disciplinary, other) ───
    public function getApprovals(Request $request)
    {
        $query = Approval::where('school_id', $this->schoolId())
            ->with('requester', 'approver');

        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->get());
    }

    public function createApproval(Request $request)
    {
        $data = $request->validate([
            'category' => 'required|in:' . implode(',', Approval::CATEGORIES),
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'approvable_type' => 'required|string',
            'approvable_id' => 'required|integer',
        ]);

        $approval = Approval::create([
            'school_id' => $this->schoolId(),
            'category' => $data['category'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'requester_id' => auth()->id(),
            'approvable_type' => $data['approvable_type'],
            'approvable_id' => $data['approvable_id'],
            'status' => Approval::STATUS_PENDING,
        ]);

        return response()->json($approval->fresh()->load('requester'), 201);
    }

    public function respondApproval(Request $request, $id)
    {
        $approval = Approval::where('school_id', $this->schoolId())->findOrFail($id);
        if ($approval->status !== Approval::STATUS_PENDING) {
            return response()->json(['message' => 'Approval already responded to'], 422);
        }

        $data = $request->validate([
            'status' => 'required|in:' . implode(',', [Approval::STATUS_APPROVED, Approval::STATUS_REJECTED]),
            'response_notes' => 'nullable|string',
        ]);

        $approval->update([
            'status' => $data['status'],
            'approver_id' => auth()->id(),
            'response_notes' => $data['response_notes'] ?? null,
            'responded_at' => now(),
        ]);

        // Auto-apply to related models
        if ($approval->category === 'salary' && $data['status'] === Approval::STATUS_APPROVED) {
            $target = $approval->approvable;
            if ($target && method_exists($target, 'teacherDetail') && $target->teacherDetail) {
                $target->teacherDetail->update(['salary_approved_by' => auth()->id()]);
            }
        }
        if ($approval->category === 'bonus' && $data['status'] === Approval::STATUS_APPROVED) {
            $target = $approval->approvable;
            if ($target && method_exists($target, 'teacherDetail') && $target->teacherDetail) {
                $target->teacherDetail->update(['bonus_approved_by' => auth()->id()]);
            }
        }

        return response()->json(['message' => 'Approval ' . $data['status'], 'approval' => $approval->fresh()->load('requester', 'approver')]);
    }

    public function getApprovalCategories()
    {
        return response()->json(Approval::CATEGORIES);
    }

    public function getPendingCounts()
    {
        $schoolId = $this->schoolId();
        $counts = Approval::where('school_id', $schoolId)
            ->where('status', Approval::STATUS_PENDING)
            ->selectRaw("category, count(*) as count")
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();
        $counts['all'] = array_sum($counts);
        $counts['grade_submissions'] = GradeSubmission::where('school_id', $schoolId)
            ->whereIn('status', ['forwarded', 'pending', 'reviewed'])->count();
        $counts['transcripts'] = Transcript::where('school_id', $schoolId)
            ->where('status', 'pending_approval')->count();
        $counts['fees'] = Fee::where('school_id', $schoolId)
            ->where('approval_status', 'pending_hos')->count();
        return response()->json($counts);
    }

    // ─── Fee / Fine Final Approval ──────────────────────────────
    public function getPendingFees()
    {
        $fees = Fee::with('student', 'reviewedByAh')
            ->where('school_id', $this->schoolId())
            ->where('approval_status', 'pending_hos')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($fees);
    }

    public function approveFee(Request $request, $id)
    {
        $data = $request->validate([
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string',
        ]);

        $fee = Fee::where('school_id', $this->schoolId())->findOrFail($id);

        if ($data['action'] === 'approve') {
            $fee->update([
                'approval_status' => 'approved',
                'approved_by_hos' => auth()->id(),
                'approved_at_hos' => now(),
                'hos_notes' => $data['notes'] ?? null,
            ]);
        } else {
            $fee->update([
                'approval_status' => 'rejected',
                'approved_by_hos' => auth()->id(),
                'approved_at_hos' => now(),
                'hos_notes' => $data['notes'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Fee ' . $data['action'] . 'd', 'fee' => $fee->fresh()->load('student')]);
    }

    // ─── School Profile Configuration (PRD School Admin) ──────
    public function schoolProfile()
    {
        $school = School::findOrFail($this->schoolId());
        return response()->json($school);
    }

    public function updateSchoolProfile(Request $request)
    {
        $school = School::findOrFail($this->schoolId());

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'logo' => 'nullable|string|max:2048',
            'config' => 'nullable|array',
            'locale' => 'nullable|string|in:en,sw',
        ]);

        $school->update($data);

        return response()->json([
            'message' => 'School profile updated',
            'school' => $school->fresh(),
        ]);
    }

    // ─── School Term Management ────────────────────────────────
    public function getTerms()
    {
        $school = School::findOrFail($this->schoolId());
        $config = $school->config ?? [];
        $terms = $config['terms'] ?? [];

        return response()->json($terms);
    }

    public function storeTerm(Request $request)
    {
        $school = School::findOrFail($this->schoolId());
        $config = $school->config ?? [];

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'boolean',
        ]);

        $terms = $config['terms'] ?? [];

        if ($data['is_current'] ?? false) {
            foreach ($terms as &$t) $t['is_current'] = false;
        }

        $terms[] = $data;
        $config['terms'] = $terms;
        $school->update(['config' => $config]);

        return response()->json(['message' => 'Term added', 'terms' => $terms], 201);
    }
}
