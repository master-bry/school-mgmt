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

        $approvedApprovals = [];
        $permissionStudentIds = collect($request->attendances)
            ->where('status', 'permission')
            ->pluck('student_id');
        $students = User::whereIn('id', $permissionStudentIds)->get()->keyBy('id');

        $schoolId = auth()->user()->school_id;
        foreach ($request->attendances as $attendanceData) {
            $data = [
                'class_id' => $request->class_id,
                'status' => $attendanceData['status'],
                'remarks' => $attendanceData['remarks'] ?? null,
                'marked_by' => auth()->id(),
                'school_id' => $schoolId,
            ];

            if ($attendanceData['status'] === 'permission') {
                $data['permission_reason'] = $attendanceData['permission_reason'] ?? null;
                $data['permission_days'] = $attendanceData['permission_days'] ?? null;
                $data['permission_status'] = 'pending_academician';
            }

            $attendance = Attendance::updateOrCreate(
                [
                    'student_id' => $attendanceData['student_id'],
                    'date' => $request->date,
                ],
                $data
            );

            // Auto-create permission approval request
            if ($attendanceData['status'] === 'permission') {
                $student = $students->get($attendanceData['student_id']);
                $approval = Approval::create([
                    'school_id' => auth()->user()->school_id,
                    'category' => 'permission',
                    'title' => 'Attendance Permission: ' . ($student->name ?? 'Student'),
                    'description' => 'Reason: ' . ($attendanceData['permission_reason'] ?? 'N/A') . "\nDays: " . ($attendanceData['permission_days'] ?? 1) . "\nDate: " . $request->date,
                    'requester_id' => auth()->id(),
                    'approvable_type' => Attendance::class,
                    'approvable_id' => $attendance->id,
                    'status' => Approval::STATUS_PENDING,
                ]);
                $approvedApprovals[] = $approval->id;
            }
        }

        return response()->json([
            'message' => 'Attendance marked successfully',
            'permission_approvals' => $approvedApprovals,
        ]);
    }

    public function show($class_id)
    {
        $attendances = Attendance::where('class_id', $class_id)
            ->where('school_id', auth()->user()->school_id)
            ->with('student')
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($attendances);
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
