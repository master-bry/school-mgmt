<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Event;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AcademicResource;
use App\Models\Book;
use App\Models\Exam;
use App\Models\Timetable;
use App\Models\Announcement;
use App\Models\Grade;
use App\Models\Fee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    public function dashboard()
    {
        $student = auth()->user()->load('class', 'school');

        // Attendance stats
        $attendanceCounts = $student->attendances()
            ->selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        $attendanceStats = [
            'present' => $attendanceCounts->get('present', 0),
            'absent' => $attendanceCounts->get('absent', 0),
            'late' => $attendanceCounts->get('late', 0),
            'excused' => $attendanceCounts->get('excused', 0),
        ];

        // Academic performance
        $averageGrade = $student->grades()->avg('percentage');
        $recentGrades = $student->grades()->with('exam.subject', 'exam.class')
            ->latest()->take(5)->get();

        // Grade trend for growth matrix
        $allGrades = $student->grades()->with('exam.subject')
            ->orderBy('created_at')->get()
            ->groupBy(fn($g) => $g->exam?->subject?->name ?? 'General')
            ->map(fn($grades, $subject) => [
                'subject' => $subject,
                'grades' => $grades->pluck('percentage'),
                'average' => round($grades->avg('percentage'), 1),
                'trend' => $grades->count() >= 2 ? ($grades->last()->percentage > $grades->first()->percentage ? 'improving' : 'declining') : 'stable',
            ]);

        // Fees summary
        $fees = $student->fees()->orderBy('due_date', 'desc')->get();
        $totalFees = $fees->sum('amount');
        $paidFees = $fees->sum('paid_amount');
        $pendingFees = $totalFees - $paidFees;

        // Upcoming exams
        $upcomingExams = Exam::whereHas('class', fn($q) => $q->where('id', $student->class_id))
            ->where('exam_date', '>=', now())
            ->with('subject')->orderBy('exam_date')->take(5)->get();

        // Today's timetable
        $todayTimetable = Timetable::where('school_id', $student->school_id)
            ->where('class_id', $student->class_id)
            ->where('day', strtolower(now()->format('l')))
            ->with('subject', 'teacher')
            ->orderBy('start_time')->get();

        // Recent announcements / bulletin
        $bulletins = Announcement::where('school_id', $student->school_id)
            ->where('is_public', true)->latest()->take(3)->get();

        // Resources locker
        $recentResources = AcademicResource::where('school_id', $student->school_id)
            ->where('is_public', true)->latest()->take(3)->get();

        return response()->json([
            'student' => $student,
            'attendance_stats' => $attendanceStats,
            'average_grade' => round($averageGrade ?? 0, 2),
            'recent_grades' => $recentGrades,
            'grade_trends' => $allGrades,
            'fee_summary' => [
                'total' => $totalFees,
                'paid' => $paidFees,
                'pending' => $pendingFees,
            ],
            'upcoming_exams' => $upcomingExams,
            'today_timetable' => $todayTimetable,
            'bulletins' => $bulletins,
            'recent_resources' => $recentResources,
        ]);
    }

    public function timetables(Request $request)
    {
        $student = auth()->user();
        $query = Timetable::with(['class', 'subject', 'teacher'])
            ->where('school_id', $student->school_id);

        if ($student->class_id) $query->where('class_id', $student->class_id);
        if ($request->academic_year) $query->where('academic_year', $request->academic_year);
        if ($request->term) $query->where('term', $request->term);
        if ($request->grade_id) $query->where('class_id', $request->grade_id);
        if ($request->subject_id) $query->where('subject_id', $request->subject_id);
        if ($request->venue) $query->where('venue', 'like', '%' . $request->venue . '%');
        if ($request->timetable_type) $query->where('timetable_type', $request->timetable_type);

        return response()->json($query->orderBy('day')->orderBy('start_time')->get());
    }

    public function blogs()
    {
        return response()->json(
            Blog::with('author')
                ->where('school_id', auth()->user()->school_id)
                ->where('is_published', true)
                ->orderBy('published_at', 'desc')->get()
        );
    }

    public function events()
    {
        return response()->json(
            Event::with('createdBy')
                ->where('school_id', auth()->user()->school_id)
                ->where('is_public', true)
                ->where('event_date', '>=', now()->subDays(30))
                ->orderBy('event_date')->get()
        );
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

    // ─── Assignment Locker (PRD Student Feature) ───────────────
    public function assignments()
    {
        $student = auth()->user();
        return response()->json(
            Assignment::where('class_id', $student->class_id)
                ->with('subject', 'teacher', 'submissions')
                ->orderBy('due_date', 'desc')
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'description' => $a->description,
                    'subject' => $a->subject?->name,
                    'teacher' => $a->teacher?->name,
                    'due_date' => $a->due_date,
                    'max_score' => $a->max_score,
                    'submission' => $a->submissions->firstWhere('student_id', $student->id),
                    'is_late' => $a->due_date?->isPast(),
                ])
        );
    }

    public function submitAssignment(Request $request, $id)
    {
        $student = auth()->user();
        $assignment = Assignment::where('class_id', $student->class_id)->findOrFail($id);

        $request->validate([
            'file' => 'nullable|file|mimes:pdf,doc,docx,zip,jpg,png|max:51200',
            'notes' => 'nullable|string|max:2000',
        ]);

        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $id, 'student_id' => $student->id],
            [
                'notes' => $request->notes,
                'status' => 'submitted',
                'submitted_at' => now(),
            ]
        );

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store(
                'assignments/' . $assignment->id . '/' . $student->id,
                'public'
            );
            $submission->update(['file_path' => $path]);
        }

        return response()->json([
            'message' => 'Assignment submitted successfully',
            'submission' => $submission->fresh()->load('assignment.subject'),
        ]);
    }
}
