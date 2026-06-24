<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Exam;
use App\Models\Timetable;
use App\Models\AcademicResource;
use App\Models\Book;
use App\Models\TeacherRemark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TeacherController extends Controller
{
    public function assignedClasses()
    {
        $teacher = auth()->user();
        $classes = $teacher->taughtClasses()->with(['students' => fn($q) => $q->where('role', 'student')->select('id', 'name', 'class_id')])->get();
        return response()->json($classes);
    }

    public function dashboard()
    {
        $teacher = auth()->user();
        $schoolId = $teacher->school_id;

        $classes = $teacher->taughtClasses()->withCount('students')->get();
        $subjects = $teacher->subjects()->get();

        // Today's timetable
        $todayTimetable = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('day', strtolower(now()->format('l')))
            ->with('class', 'subject')
            ->orderBy('start_time')
            ->get();

        // Today's attendance stats
        $todayAttendance = Attendance::where('school_id', $schoolId)
            ->where('marked_by', $teacher->id)
            ->whereDate('date', today());
        $totalMarked = $todayAttendance->count();
        $presentCount = $todayAttendance->where('status', 'present')->count();
        $absentCount = $todayAttendance->where('status', 'absent')->count();

        // Recent submissions
        $recentGrades = Grade::whereHas('exam', fn($q) => $q->whereIn('subject_id', $subjects->pluck('id')))
            ->with(['student', 'exam.subject'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'assigned_classes' => $classes->count(),
            'assigned_subjects' => $subjects->count(),
            'total_students' => $classes->sum('students_count'),
            'classes' => $classes,
            'subjects' => $subjects,
            'today_timetable' => $todayTimetable,
            'today_attendance' => [
                'total_marked' => $totalMarked,
                'present' => $presentCount,
                'absent' => $absentCount,
            ],
            'recent_grades' => $recentGrades,
            'recent_attendances' => $teacher->markedAttendances()->with('student', 'class')
                ->latest()->take(10)->get(),
        ]);
    }

    public function resources()
    {
        return response()->json(
            AcademicResource::with('uploadedBy')
                ->where('school_id', auth()->user()->school_id)
                ->where('is_public', true)
                ->orderBy('created_at', 'desc')->get()
        );
    }

    public function books()
    {
        return response()->json(
            Book::with('uploadedBy')
                ->where('school_id', auth()->user()->school_id)
                ->get()
        );
    }

    // ─── Assignment Management (Digital Markbook) ──────────────
    public function storeAssignment(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'max_score' => 'nullable|integer|min:1',
        ]);

        $assignment = Assignment::create([
            'school_id' => auth()->user()->school_id,
            'teacher_id' => auth()->id(),
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'],
            'title' => $data['title'],
            'description' => $data['description'],
            'due_date' => $data['due_date'],
            'max_score' => $data['max_score'],
        ]);

        return response()->json($assignment->load('subject', 'class'), 201);
    }

    public function assignments()
    {
        $teacher = auth()->user();
        return response()->json(
            Assignment::where('teacher_id', $teacher->id)
                ->with('subject', 'class')
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function updateAssignment(Request $request, $id)
    {
        $assignment = Assignment::where('teacher_id', auth()->id())->findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'sometimes|date',
            'max_score' => 'nullable|integer|min:1',
        ]);
        $assignment->update($data);
        return response()->json($assignment->fresh()->load('subject', 'class'));
    }

    public function deleteAssignment($id)
    {
        $assignment = Assignment::where('teacher_id', auth()->id())->findOrFail($id);
        $assignment->delete();
        return response()->json(null, 204);
    }

    public function submissions($id)
    {
        $assignment = Assignment::where('teacher_id', auth()->id())->findOrFail($id);
        return response()->json(
            AssignmentSubmission::where('assignment_id', $assignment->id)
                ->with('student:id,name,email')
                ->get()
        );
    }

    public function gradeSubmission(Request $request, $id)
    {
        $data = $request->validate([
            'score' => 'required|integer|min:0',
            'feedback' => 'nullable|string',
        ]);

        $submission = AssignmentSubmission::findOrFail($id);
        $assignment = Assignment::where('teacher_id', auth()->id())
            ->where('id', $submission->assignment_id)
            ->firstOrFail();

        if ($data['score'] > ($assignment->max_score ?? 100)) {
            return response()->json(['message' => 'Score exceeds maximum score'], 422);
        }

        $submission->update([
            'score' => $data['score'],
            'feedback' => $data['feedback'],
            'status' => 'graded',
        ]);

        return response()->json($submission->fresh()->load('student'));
    }

    // ─── Teacher Remarks Module ─────────────────────────────────
    public function storeRemark(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:users,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'category' => 'required|string|in:behavior,academic,effort,conduct,attendance',
            'remark' => 'required|string|max:2000',
            'term' => 'nullable|string|max:100',
        ]);

        $remark = TeacherRemark::create([
            'school_id' => auth()->user()->school_id,
            'teacher_id' => auth()->id(),
            'student_id' => $data['student_id'],
            'subject_id' => $data['subject_id'],
            'category' => $data['category'],
            'remark' => $data['remark'],
            'term' => $data['term'],
        ]);

        return response()->json($remark->load('student', 'subject'), 201);
    }

    public function remarks()
    {
        $teacher = auth()->user();
        return response()->json(
            TeacherRemark::where('teacher_id', $teacher->id)
                ->with('student:id,name', 'subject:id,name')
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }
}
