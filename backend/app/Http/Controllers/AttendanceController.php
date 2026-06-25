<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\Approval;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused,permission',
            'attendances.*.permission_reason' => 'required_if:attendances.*.status,permission|nullable|string',
            'attendances.*.permission_days' => 'required_if:attendances.*.status,permission|nullable|integer|min:1',
        ]);

        $schoolId = auth()->user()->school_id;
        $class = ClassModel::findOrFail($request->class_id);
        $date = $request->date;

        $totalStudents = User::where('school_id', $schoolId)
            ->where('role', 'student')
            ->where('class_id', $class->id)
            ->count();

        $attendancesCount = count($request->attendances);

        if ($attendancesCount !== $totalStudents) {
            return response()->json([
                'message' => "Attendance records ($attendancesCount) must account for all $totalStudents enrolled students in this class",
            ], 422);
        }

        // Check if attendance already taken for this class+date
        $existingCount = Attendance::where('class_id', $class->id)
            ->where('date', $date)
            ->where('school_id', $schoolId)
            ->count();

        $isUpdate = $existingCount > 0;

        $approvedApprovals = [];
        $permissionStudentIds = collect($request->attendances)
            ->where('status', 'permission')
            ->pluck('student_id');
        $students = User::whereIn('id', $permissionStudentIds)->get()->keyBy('id');

        $saved = [];

        foreach ($request->attendances as $attendanceData) {
            $data = [
                'class_id' => $class->id,
                'status' => $attendanceData['status'],
                'remarks' => $attendanceData['remarks'] ?? null,
                'marked_by' => auth()->id(),
                'school_id' => $schoolId,
            ];

            if ($attendanceData['status'] === 'permission') {
                $data['permission_reason'] = $attendanceData['permission_reason'] ?? null;
                $data['permission_days'] = $attendanceData['permission_days'] ?? null;
                $data['permission_status'] = 'pending_academician';
            } else {
                $data['permission_reason'] = null;
                $data['permission_days'] = null;
                $data['permission_status'] = null;
            }

            $attendance = Attendance::updateOrCreate(
                [
                    'student_id' => $attendanceData['student_id'],
                    'date' => $date,
                ],
                $data
            );

            $saved[] = $attendance->load('student:id,name');

            if ($attendanceData['status'] === 'permission' && !$isUpdate) {
                $student = $students->get($attendanceData['student_id']);
                $approval = Approval::create([
                    'school_id' => $schoolId,
                    'category' => 'permission',
                    'title' => 'Attendance Permission: ' . ($student->name ?? 'Student'),
                    'description' => 'Reason: ' . ($attendanceData['permission_reason'] ?? 'N/A') . "\nDays: " . ($attendanceData['permission_days'] ?? 1) . "\nDate: " . $date,
                    'requester_id' => auth()->id(),
                    'approvable_type' => Attendance::class,
                    'approvable_id' => $attendance->id,
                    'status' => Approval::STATUS_PENDING,
                ]);
                $approvedApprovals[] = $approval->id;
            }
        }

        $summary = [
            'total_enrolled' => $totalStudents,
            'total_marked' => $attendancesCount,
            'present' => collect($request->attendances)->where('status', 'present')->count(),
            'absent' => collect($request->attendances)->where('status', 'absent')->count(),
            'late' => collect($request->attendances)->where('status', 'late')->count(),
            'excused' => collect($request->attendances)->where('status', 'excused')->count(),
            'permission' => collect($request->attendances)->where('status', 'permission')->count(),
            'percentage' => $totalStudents > 0 ? round((collect($request->attendances)->where('status', 'present')->count() / $totalStudents) * 100, 1) : 0,
        ];

        return response()->json([
            'message' => $isUpdate ? 'Attendance updated successfully' : 'Attendance marked successfully',
            'is_update' => $isUpdate,
            'attendances' => $saved,
            'summary' => $summary,
            'permission_approvals' => $approvedApprovals,
        ]);
    }

    public function show($class_id)
    {
        $schoolId = auth()->user()->school_id;

        $class = ClassModel::findOrFail($class_id);
        $totalEnrolled = User::where('school_id', $schoolId)
            ->where('role', 'student')
            ->where('class_id', $class->id)
            ->count();

        $attendances = Attendance::where('class_id', $class_id)
            ->where('school_id', $schoolId)
            ->with('student:id,name')
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'attendances' => $attendances,
            'total_enrolled' => $totalEnrolled,
            'class' => $class->only(['id', 'name', 'section']),
        ]);
    }

    public function showByDate(Request $request, $class_id)
    {
        $date = $request->query('date', now()->toDateString());

        $attendances = Attendance::where('class_id', $class_id)
            ->where('school_id', auth()->user()->school_id)
            ->where('date', $date)
            ->with('student:id,name')
            ->get();

        return response()->json([
            'attendances' => $attendances,
            'date' => $date,
            'class_id' => (int) $class_id,
        ]);
    }

    public function studentAttendance()
    {
        $student = auth()->user();
        $attendances = $student->attendances()
            ->with('class')
            ->orderBy('date', 'desc')
            ->paginate(30);

        return response()->json($attendances);
    }
}
