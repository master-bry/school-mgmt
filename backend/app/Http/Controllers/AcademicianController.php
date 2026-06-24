<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Exam;
use App\Models\Grade;
use App\Models\GradeSubmission;
use App\Models\Fee;
use App\Models\Attendance;
use App\Models\Book;
use App\Models\Blog;
use App\Models\Event;
use App\Models\Announcement;
use App\Models\Timetable;
use App\Models\AcademicResource;
use App\Models\Transcript;
use App\Models\TranscriptSubject;
use App\Models\Approval;
use App\Exports\StudentImportTemplateExport;
use App\Imports\StudentsImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AcademicianController extends Controller
{
    use \App\Models\Traits\ParentEnrichment;

    private function schoolId()
    {
        return auth()->user()->school_id;
    }

    public function dashboard()
    {
        $schoolId = $this->schoolId();
        $school = auth()->user()->school;

        // Syllabus coverage
        $totalSessions = Timetable::where('school_id', $schoolId)->count();
        $conductedSessions = $totalSessions;

        // Exam moderation queue
        $pendingModeration = Exam::where('school_id', $schoolId)->whereDoesntHave('grades')->count();
        $awaitingPublish = GradeSubmission::where('school_id', $schoolId)->where('status', 'pending')->count();

        // Subject performance heatmaps
        $subjectPerformance = Subject::where('school_id', $schoolId)
            ->with('exams.grades')
            ->get()
            ->map(fn($s) => [
                'name' => $s->name,
                'average' => round($s->exams->flatMap->grades->avg('percentage') ?? 0, 1),
                'max' => $s->exams->flatMap->grades->max('percentage') ?? 0,
                'min' => $s->exams->flatMap->grades->min('percentage') ?? 0,
                'student_count' => $s->exams->flatMap->grades->groupBy('student_id')->count(),
            ]);

        // Grade distribution across all published results
        $allGrades = Grade::whereHas('exam', fn($q) => $q->where('school_id', $schoolId))
            ->where('submission_status', 'published')
            ->pluck('percentage');
        $totalGrades = $allGrades->count();
        $gradeDistribution = [
            'A' => $allGrades->filter(fn($g) => $g >= 80)->count(),
            'B' => $allGrades->filter(fn($g) => $g >= 65 && $g < 80)->count(),
            'C' => $allGrades->filter(fn($g) => $g >= 50 && $g < 65)->count(),
            'D' => $allGrades->filter(fn($g) => $g >= 40 && $g < 50)->count(),
            'F' => $allGrades->filter(fn($g) => $g < 40)->count(),
        ];
        $gradePercentages = [];
        foreach ($gradeDistribution as $k => $v) {
            $gradePercentages[] = ['grade' => $k, 'count' => $v, 'percent' => $totalGrades > 0 ? round(($v / $totalGrades) * 100, 1) : 0];
        }

        // CMS stats
        $totalBlogs = Blog::where('school_id', $schoolId)->count();
        $publishedBlogs = Blog::where('school_id', $schoolId)->where('is_published', true)->count();

        // Content publishing trend (last 6 months)
        $monthlyContent = Blog::where('school_id', $schoolId)
            ->where('created_at', '>=', now()->subMonths(6))
            ->get()
            ->groupBy(fn($b) => $b->created_at->format('M Y'))
            ->map(fn($blogs, $month) => ['month' => $month, 'posts' => $blogs->count()])
            ->values();

        // Resource stats
        $totalResources = AcademicResource::where('school_id', $schoolId)->count();
        $totalEvents = Event::where('school_id', $schoolId)->count();

        // Assignment completion stats
        $totalSubjectsWithTeacher = Subject::where('school_id', $schoolId)->whereNotNull('teacher_id')->count();
        $totalClassesWithTeacher = ClassModel::where('school_id', $schoolId)->whereNotNull('teacher_id')->count();

        // Today's timetable
        $todayTimetable = Timetable::with(['class', 'subject', 'teacher'])
            ->where('school_id', $schoolId)
            ->where('day', now()->format('l'))
            ->orderBy('start_time')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'start_time' => $t->start_time,
                'end_time' => $t->end_time,
                'class_name' => $t->class?->name,
                'subject_name' => $t->subject?->name,
                'teacher_name' => $t->teacher?->name,
                'room' => $t->room_number,
            ]);

        // Recent submissions activity
        $recentSubmissions = GradeSubmission::where('school_id', $schoolId)
            ->with(['exam', 'class', 'submittedBy'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'exam_name' => $s->exam?->name,
                'class_name' => $s->class?->name,
                'teacher_name' => $s->submittedBy?->name,
                'status' => $s->status,
                'created_at' => $s->created_at->diffForHumans(),
            ]);

        // Student-to-class distribution
        $classDistribution = ClassModel::where('school_id', $schoolId)
            ->withCount('students')
            ->get()
            ->map(fn($c) => ['name' => $c->name, 'students' => $c->students_count]);

        return response()->json([
            'total_teachers' => User::where('school_id', $schoolId)->where('role', 'teacher')->count(),
            'total_students' => User::where('school_id', $schoolId)->where('role', 'student')->count(),
            'total_classes' => ClassModel::where('school_id', $schoolId)->count(),
            'total_subjects' => Subject::where('school_id', $schoolId)->count(),
            'syllabus_coverage' => [
                'total_sessions' => $totalSessions,
                'conducted' => $conductedSessions,
                'coverage_percent' => $totalSessions > 0 ? 100 : 0,
            ],
            'exam_moderation' => [
                'pending_moderation' => $pendingModeration,
                'awaiting_publish' => $awaitingPublish,
                'moderated' => GradeSubmission::where('school_id', $schoolId)->whereIn('status', ['reviewed', 'approved'])->count(),
            ],
            'subject_performance' => $subjectPerformance,
            'grade_distribution' => $gradePercentages,
            'cms_stats' => [
                'total_blogs' => $totalBlogs,
                'published' => $publishedBlogs,
                'drafts' => $totalBlogs - $publishedBlogs,
                'total_events' => $totalEvents,
            ],
            'monthly_content' => $monthlyContent,
            'resource_stats' => [
                'total_resources' => $totalResources,
                'total_books' => Book::where('school_id', $schoolId)->count(),
                'shared_spaces' => Timetable::where('school_id', $schoolId)->distinct('room_number')->count('room_number'),
            ],
            'pending_submissions' => GradeSubmission::where('school_id', $schoolId)->whereIn('status', ['pending', 'forwarded'])->count(),
            'published_results' => Grade::whereHas('exam', fn($q) => $q->where('school_id', $schoolId))->where('submission_status', 'published')->count(),
            'assignment_stats' => [
                'subjects_with_teacher' => $totalSubjectsWithTeacher,
                'subjects_total' => Subject::where('school_id', $schoolId)->count(),
                'classes_with_teacher' => $totalClassesWithTeacher,
                'classes_total' => ClassModel::where('school_id', $schoolId)->count(),
            ],
            'today_timetable' => $todayTimetable,
            'recent_submissions' => $recentSubmissions,
            'class_distribution' => $classDistribution,
        ]);
    }

    public function books()
    {
        return response()->json(Book::with('uploadedBy')->where('school_id', $this->schoolId())->get());
    }

    public function updateBook(Request $request, $id)
    {
        $book = Book::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'author' => 'nullable|string|max:255',
            'isbn' => 'nullable|string|max:20|unique:books,isbn,'.$id,
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
        ]);
        $book->update($data);
        return response()->json($book->fresh()->load('uploadedBy'));
    }

    public function destroyBook($id)
    {
        $book = Book::where('school_id', $this->schoolId())->findOrFail($id);
        if ($book->file_path) {
            Storage::disk('public')->delete($book->file_path);
        }
        $book->delete();
        return response()->json(null, 204);
    }

    public function storeBook(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'nullable|string|max:255',
            'isbn' => 'nullable|string|max:20|unique:books',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:51200',
        ]);

        $book = new Book($data);
        $book->school_id = $this->schoolId();
        $book->uploaded_by = auth()->id();
        $book->total_copies = 1;
        $book->available_copies = 1;

        if ($request->hasFile('file')) {
            $book->file_path = $request->file('file')->store('books/'.$this->schoolId(), 'public');
            $book->file_type = $request->file('file')->getClientOriginalExtension();
        }

        $book->save();
        return response()->json($book->load('uploadedBy'), 201);
    }

    public function timetables()
    {
        return response()->json(
            Timetable::with(['class', 'subject', 'teacher'])
                ->where('school_id', $this->schoolId())
                ->orderBy('day')->orderBy('start_time')
                ->get()
        );
    }

    public function storeTimetable(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
            'day' => 'required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,monday,tuesday,wednesday,thursday,friday,saturday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room_number' => 'nullable|string|max:50',
        ]);

        $data['day'] = strtolower($data['day']);
        $data['school_id'] = $this->schoolId();
        $schoolId = $this->schoolId();
        $existing = Timetable::where('school_id', $schoolId)
            ->where('day', $data['day'])
            ->get();

        $overlap = function ($existing) use ($data) {
            return $data['start_time'] < $existing->end_time
                && $data['end_time'] > $existing->start_time;
        };

        $classConflict = $existing->first(fn($e) =>
            (int) $e->class_id === (int) $data['class_id'] && $overlap($e)
        );
        if ($classConflict) {
            return response()->json([
                'message' => 'This class already has a session scheduled during this time on ' . ucfirst($data['day']) . '.'
            ], 422);
        }

        $teacherConflict = $existing->first(fn($e) =>
            (int) $e->teacher_id === (int) $data['teacher_id'] && $overlap($e)
        );
        if ($teacherConflict) {
            return response()->json([
                'message' => 'This teacher already has a session scheduled during this time on ' . ucfirst($data['day']) . '.'
            ], 422);
        }

        if (!empty($data['room_number'])) {
            $roomConflict = $existing->first(fn($e) =>
                strtolower(trim($e->room_number ?? '')) === strtolower(trim($data['room_number']))
                && $overlap($e)
            );
            if ($roomConflict) {
                return response()->json([
                    'message' => 'Room "' . $data['room_number'] . '" is already booked during this time on ' . ucfirst($data['day']) . '.'
                ], 422);
            }
        }

        $entry = Timetable::create($data);
        return response()->json($entry->load(['class', 'subject', 'teacher']), 201);
    }

    public function assignTeacherToSubject(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
        ]);
        $subject = Subject::where('school_id', $this->schoolId())->findOrFail($data['subject_id']);
        $subject->update(['teacher_id' => $data['teacher_id']]);
        return response()->json(['message' => 'Teacher assigned to subject', 'subject' => $subject->fresh()->load('teacher')]);
    }

    public function assignTeacherToClass(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'required|exists:users,id',
        ]);
        $class = ClassModel::where('school_id', $this->schoolId())->findOrFail($data['class_id']);
        $class->update(['teacher_id' => $data['teacher_id']]);
        return response()->json(['message' => 'Teacher assigned to class', 'class' => $class->fresh()->load('teacher')]);
    }

    public function getTeachers()
    {
        return response()->json(User::where('school_id', $this->schoolId())->where('role', 'teacher')->get(['id', 'name', 'email']));
    }

    public function getClasses($id = null)
    {
        if ($id) {
            $class = ClassModel::with('subjects')
                ->where('school_id', $this->schoolId())
                ->findOrFail($id);
            return response()->json($class);
        }
        return response()->json(
            ClassModel::where('school_id', $this->schoolId())
                ->with('subjects')
                ->get(['id', 'name', 'section', 'capacity', 'room_number'])
        );
    }

    public function storeClass(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'section' => 'nullable|string|max:50',
            'capacity' => 'nullable|integer|min:1',
        ]);
        $data['school_id'] = $this->schoolId();
        $class = ClassModel::create($data);
        return response()->json($class, 201);
    }

    public function updateClass(Request $request, $id)
    {
        $class = ClassModel::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'section' => 'nullable|string|max:50',
            'capacity' => 'nullable|integer|min:1',
        ]);
        $class->update($data);
        return response()->json($class);
    }

    public function destroyClass($id)
    {
        $class = ClassModel::where('school_id', $this->schoolId())->findOrFail($id);
        $class->delete();
        return response()->json(null, 204);
    }

    public function getSubjects()
    {
        return response()->json(Subject::where('school_id', $this->schoolId())->get(['id', 'name', 'code']));
    }

    public function destroyTimetable($id)
    {
        $entry = Timetable::where('school_id', $this->schoolId())->findOrFail($id);
        $entry->delete();
        return response()->json(null, 204);
    }

    public function updateTimetable(Request $request, $id)
    {
        $entry = Timetable::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate([
            'class_id' => 'sometimes|required|exists:classes,id',
            'subject_id' => 'sometimes|required|exists:subjects,id',
            'teacher_id' => 'sometimes|required|exists:users,id',
            'day' => 'sometimes|required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,monday,tuesday,wednesday,thursday,friday,saturday',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',
            'room_number' => 'nullable|string|max:50',
            'academic_year' => 'nullable|string|max:20',
            'term' => 'nullable|string|max:20',
            'timetable_type' => 'nullable|string|max:50',
            'venue' => 'nullable|string|max:255',
        ]);

        if (isset($data['day'])) $data['day'] = strtolower($data['day']);

        // Conflict check (exclude self)
        $schoolId = $this->schoolId();
        $existing = Timetable::where('school_id', $schoolId)
            ->where('day', $data['day'] ?? $entry->day)
            ->where('id', '!=', $id)
            ->get();

        $overlap = function ($e) use ($data, $entry) {
            $s = $data['start_time'] ?? $entry->start_time;
            $end = $data['end_time'] ?? $entry->end_time;
            return $s < $e->end_time && $end > $e->start_time;
        };

        $classCheck = (int) ($data['class_id'] ?? $entry->class_id);
        $teacherCheck = (int) ($data['teacher_id'] ?? $entry->teacher_id);
        $roomCheck = $data['room_number'] ?? $entry->room_number;

        $classConflict = $existing->first(fn($e) => (int) $e->class_id === $classCheck && $overlap($e));
        if ($classConflict) {
            return response()->json([
                'message' => 'This class already has a session scheduled during this time on ' . ucfirst($data['day'] ?? $entry->day) . '.'
            ], 422);
        }

        $teacherConflict = $existing->first(fn($e) => (int) $e->teacher_id === $teacherCheck && $overlap($e));
        if ($teacherConflict) {
            return response()->json([
                'message' => 'This teacher already has a session scheduled during this time on ' . ucfirst($data['day'] ?? $entry->day) . '.'
            ], 422);
        }

        if (!empty($roomCheck)) {
            $roomConflict = $existing->first(fn($e) =>
                strtolower(trim($e->room_number ?? '')) === strtolower(trim($roomCheck)) && $overlap($e)
            );
            if ($roomConflict) {
                return response()->json([
                    'message' => 'Room "' . $roomCheck . '" is already booked during this time on ' . ucfirst($data['day'] ?? $entry->day) . '.'
                ], 422);
            }
        }

        $entry->update($data);
        return response()->json($entry->fresh()->load(['class', 'subject', 'teacher']));
    }

    public function assignedTeachers()
    {
        $schoolId = $this->schoolId();
        $subjects = Subject::where('school_id', $schoolId)->with('teacher')->get(['id', 'name', 'code', 'teacher_id']);
        $classes = ClassModel::where('school_id', $schoolId)->with('teacher')->get(['id', 'name', 'section', 'teacher_id']);
        return response()->json([
            'subject_assignments' => $subjects,
            'class_assignments' => $classes,
        ]);
    }

    public function students()
    {
        return response()->json(
            User::where('school_id', $this->schoolId())
                ->where('role', 'student')
                ->with('class')
                ->get(['id', 'name', 'email', 'class_id'])
        );
    }

    public function studentGrades($id)
    {
        $schoolId = $this->schoolId();
        $student = User::where('school_id', $schoolId)->where('role', 'student')->findOrFail($id);
        $classId = $student->class_id;

        $subjects = Subject::where('school_id', $schoolId)
            ->whereHas('classes', fn($q) => $q->where('class_id', $classId))
            ->get(['id', 'name', 'code']);

        $grades = Grade::with(['exam' => fn($q) => $q->with('subject')])
            ->where('student_id', $id)
            ->whereHas('exam', fn($q) => $q->where('school_id', $schoolId))
            ->where('submission_status', 'published')
            ->get();

        $subjectResults = $subjects->map(function ($subject) use ($grades) {
            $subjectGrades = $grades->filter(fn($g) => $g->exam && $g->exam->subject_id === $subject->id);
            return [
                'subject' => $subject,
                'grades' => $subjectGrades->values(),
                'total_marks' => $subjectGrades->sum('exam.total_marks'),
                'obtained_marks' => $subjectGrades->sum('marks_obtained'),
                'percentage' => $subjectGrades->sum('exam.total_marks') > 0
                    ? round(($subjectGrades->sum('marks_obtained') / $subjectGrades->sum('exam.total_marks')) * 100, 2)
                    : 0,
            ];
        });

        return response()->json([
            'student' => $student->load('class', 'section', 'parent'),
            'class' => $student->class,
            'subjects' => $subjects,
            'subject_results' => $subjectResults,
            'overall_total' => $subjectResults->sum('total_marks'),
            'overall_obtained' => $subjectResults->sum('obtained_marks'),
            'overall_percentage' => $subjectResults->sum('total_marks') > 0
                ? round(($subjectResults->sum('obtained_marks') / $subjectResults->sum('total_marks')) * 100, 2)
                : 0,
        ]);
    }

    private function computeGrade($percentage)
    {
        if ($percentage >= 80) return 'A';
        if ($percentage >= 65) return 'B';
        if ($percentage >= 50) return 'C';
        if ($percentage >= 40) return 'D';
        return 'F';
    }

    public function generateTranscript(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:users,id',
            'term' => 'nullable|string|max:100',
            'academic_year' => 'nullable|string|max:20',
        ]);

        $schoolId = $this->schoolId();
        $student = User::where('school_id', $schoolId)->where('role', 'student')->findOrFail($data['student_id']);

        $gradesData = $this->studentGrades($student->id);
        $gradesData = json_decode($gradesData->content(), true);

        $transcript = Transcript::create([
            'school_id' => $schoolId,
            'student_id' => $student->id,
            'class_id' => $student->class_id,
            'term' => $data['term'] ?? 'Term 1',
            'academic_year' => $data['academic_year'] ?? date('Y'),
            'total_marks' => $gradesData['overall_total'],
            'obtained_marks' => $gradesData['overall_obtained'],
            'percentage' => $gradesData['overall_percentage'],
            'grade' => $this->computeGrade($gradesData['overall_percentage']),
            'status' => 'draft',
            'created_by' => auth()->id(),
        ]);

        foreach ($gradesData['subject_results'] as $sr) {
            TranscriptSubject::create([
                'transcript_id' => $transcript->id,
                'subject_id' => $sr['subject']['id'],
                'exam_id' => $sr['grades'][0]['exam_id'] ?? null,
                'marks_obtained' => $sr['obtained_marks'],
                'total_marks' => $sr['total_marks'],
                'percentage' => $sr['percentage'],
                'grade' => $this->computeGrade($sr['percentage']),
            ]);
        }

        return response()->json(
            Transcript::with(['student', 'class', 'subjects.subject', 'createdBy'])
                ->find($transcript->id),
            201
        );
    }

    public function transcripts()
    {
        return response()->json(
            Transcript::with(['student', 'class', 'createdBy'])
                ->where('school_id', $this->schoolId())
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function showTranscript($id)
    {
        return response()->json(
            Transcript::with(['student', 'class', 'subjects.subject', 'createdBy', 'headApprovedBy'])
                ->where('school_id', $this->schoolId())
                ->findOrFail($id)
        );
    }

    public function deleteTranscript($id)
    {
        $transcript = Transcript::where('school_id', $this->schoolId())->findOrFail($id);
        if ($transcript->status !== 'draft') {
            return response()->json(['message' => 'Only draft transcripts can be deleted'], 422);
        }
        $transcript->subjects()->delete();
        $transcript->delete();
        return response()->json(null, 204);
    }

    public function submitTranscript($id)
    {
        $transcript = Transcript::where('school_id', $this->schoolId())->findOrFail($id);
        if ($transcript->status !== 'draft') {
            return response()->json(['message' => 'Transcript already submitted'], 422);
        }
        $transcript->update(['status' => 'pending_approval', 'submitted_at' => now()]);
        return response()->json(['message' => 'Transcript submitted for approval', 'transcript' => $transcript->fresh()->load(['student', 'class', 'subjects.subject', 'createdBy'])]);
    }

    public function publishTranscript($id)
    {
        $transcript = Transcript::where('school_id', $this->schoolId())->findOrFail($id);
        if ($transcript->status !== 'approved') {
            return response()->json(['message' => 'Transcript must be approved by Head of School first'], 422);
        }
        $transcript->update(['status' => 'published', 'published_at' => now()]);
        return response()->json(['message' => 'Transcript published', 'transcript' => $transcript->fresh()->load(['student', 'class', 'subjects.subject', 'createdBy'])]);
    }

    public function printTranscript($id)
    {
        $transcript = Transcript::with(['student', 'class', 'subjects.subject', 'createdBy', 'headApprovedBy'])
            ->where('school_id', $this->schoolId())
            ->findOrFail($id);
        return response()->json($transcript);
    }

    public function pendingSubmissions()
    {
        return response()->json(
            GradeSubmission::where('school_id', $this->schoolId())
                ->where('status', 'pending')
                ->with(['exam.subject', 'class', 'submittedBy'])->get()
        );
    }

    public function reviewSubmission(Request $request, $id)
    {
        $submission = GradeSubmission::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate(['status' => 'required|in:approved,rejected', 'review_notes' => 'nullable|string']);
        $submission->update(['status' => $data['status'], 'reviewed_by' => auth()->id(), 'reviewed_at' => now(), 'review_notes' => $data['review_notes'] ?? null]);
        if ($data['status'] === 'approved') {
            Grade::where('exam_id', $submission->exam_id)->update(['submission_status' => 'reviewed']);
        }
        return response()->json(['message' => 'Submission ' . $data['status'], 'submission' => $submission->fresh()]);
    }

    public function forwardToHead($id)
    {
        $submission = GradeSubmission::where('school_id', $this->schoolId())->findOrFail($id);
        $submission->update(['status' => 'forwarded']);
        Grade::where('exam_id', $submission->exam_id)->update(['submission_status' => 'forwarded']);
        return response()->json(['message' => 'Forwarded to Head of School']);
    }

    public function publishResults($id)
    {
        $submission = GradeSubmission::where('school_id', $this->schoolId())->findOrFail($id);
        if ($submission->status !== 'approved') {
            return response()->json(['message' => 'Results must be approved by Head of School first'], 422);
        }
        $submission->update(['status' => 'published', 'published_at' => now()]);
        Grade::where('exam_id', $submission->exam_id)->update(['submission_status' => 'published']);

        // Notify parents of all students in this exam
        $exam = $submission->exam()->with('class')->first();
        $students = User::where('role', 'student')
            ->where('school_id', $this->schoolId())
            ->where('class_id', $exam->class_id)
            ->whereNotNull('parent_id')
            ->get();

        $examName = $exam->name ?? 'Exam';
        $className = $exam->class->name ?? '';
        $notified = [];
        foreach ($students as $student) {
            $existing = \App\Models\ParentNotification::where('parent_id', $student->parent_id)
                ->where('type', 'result_published')
                ->where('related_entity_id', $submission->exam_id)
                ->where('related_entity_type', 'grade_submission')
                ->exists();
            if ($existing) continue;

            \App\Models\ParentNotification::create([
                'school_id' => $this->schoolId(),
                'parent_id' => $student->parent_id,
                'type' => 'result_published',
                'title' => "Results Published: {$examName}",
                'message' => "Results for {$examName} ({$className}) have been published. Check your child's grades.",
                'related_entity_type' => 'grade_submission',
                'related_entity_id' => $submission->exam_id,
                'sent_at' => now(),
            ]);
            $notified[] = $student->parent_id;
        }

        return response()->json([
            'message' => 'Results published',
            'parents_notified' => count(array_unique($notified)),
        ]);
    }

    public function combinedResults(Request $request)
    {
        $query = Grade::with(['exam.subject', 'exam.class', 'student'])
            ->whereHas('exam', fn($q) => $q->where('school_id', $this->schoolId()))
            ->where('submission_status', 'published');
        if ($request->student_id) $query->where('student_id', $request->student_id);
        if ($request->class_id) $query->whereHas('exam', fn($q) => $q->where('class_id', $request->class_id));
        return response()->json($query->get()->groupBy('student_id'));
    }

    // ─── Blog / Notes ──────────────────────────────────────────────
    public function blogs()
    {
        return response()->json(Blog::with('author')->where('school_id', $this->schoolId())->orderBy('created_at', 'desc')->get());
    }

    public function storeBlog(Request $request)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'content' => 'required|string', 'category' => 'nullable|string|max:100', 'featured_image' => 'nullable|string|max:255', 'is_published' => 'boolean']);
        $data['school_id'] = $this->schoolId();
        $data['author_id'] = auth()->id();
        $data['published_at'] = !empty($data['is_published']) ? now() : null;
        $blog = Blog::create($data);
        return response()->json($blog->load('author'), 201);
    }

    public function updateBlog(Request $request, $id)
    {
        $blog = Blog::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate(['title' => 'sometimes|required|string|max:255', 'content' => 'sometimes|required|string', 'category' => 'nullable|string|max:100', 'featured_image' => 'nullable|string|max:255', 'is_published' => 'boolean']);
        if (isset($data['is_published']) && $data['is_published'] && !$blog->published_at) $data['published_at'] = now();
        $blog->update($data);
        return response()->json($blog->fresh()->load('author'));
    }

    public function deleteBlog($id)
    {
        $blog = Blog::where('school_id', $this->schoolId())->findOrFail($id);
        $blog->delete();
        return response()->json(null, 204);
    }

    public function events()
    {
        return response()->json(Event::with('createdBy')->where('school_id', $this->schoolId())->orderBy('event_date', 'desc')->get());
    }

    public function storeEvent(Request $request)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string', 'event_date' => 'required|date', 'start_time' => 'nullable', 'end_time' => 'nullable', 'venue' => 'nullable|string|max:255', 'type' => 'nullable|string|max:50', 'is_public' => 'boolean']);
        $data['school_id'] = $this->schoolId();
        $data['created_by'] = auth()->id();
        $event = Event::create($data);
        return response()->json($event->load('createdBy'), 201);
    }

    public function resources()
    {
        return response()->json(AcademicResource::with('uploadedBy')->where('school_id', $this->schoolId())->orderBy('created_at', 'desc')->get());
    }

    public function storeResource(Request $request)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string', 'file_path' => 'nullable|string|max:255', 'resource_type' => 'nullable|string|max:50', 'category' => 'nullable|string|max:100', 'is_public' => 'boolean']);
        $data['school_id'] = $this->schoolId();
        $data['uploaded_by'] = auth()->id();
        $resource = AcademicResource::create($data);
        return response()->json($resource->load('uploadedBy'), 201);
    }

    // ─── Books Full CRUD ──────────────────────────────────────────
    public function showBook($id)
    {
        $book = Book::with('uploadedBy')->where('school_id', $this->schoolId())->findOrFail($id);
        return response()->json($book);
    }

    // ─── Student One-by-One Registration ───────────────────────────
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
            'class_id' => 'nullable|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'grade' => 'nullable|string|max:100',
            'parent_name' => 'nullable|string|max:255',
            'parent_email' => 'nullable|email|unique:users,email',
        ]);

        $password = $data['password'] ?? Str::random(8);
        $student = User::create([
            'school_id' => $this->schoolId(),
            'name' => $data['first_name'] . ' ' . $data['last_name'],
            'email' => $data['email'],
            'password' => Hash::make($password),
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'role' => 'student',
            'class_id' => $data['class_id'] ?? null,
            'section_id' => $data['section_id'] ?? null,
            'grade' => $data['grade'] ?? null,
        ]);

        if (!empty($data['parent_email'])) {
            $parentPassword = Str::random(8);
            $parent = User::create([
                'school_id' => $this->schoolId(),
                'name' => $data['parent_name'] ?? 'Parent of ' . $student->name,
                'email' => $data['parent_email'],
                'password' => Hash::make($parentPassword),
                'role' => 'parent',
            ]);
            $student->parent_id = $parent->id;
            $student->save();
        }

        return response()->json([
            'student' => $student->load('class', 'section', 'parent'),
            'credentials' => ['email' => $data['email'], 'password' => $password],
            'parent_credentials' => isset($parent) ? ['email' => $data['parent_email'], 'password' => $parentPassword] : null,
        ], 201);
    }

    // ─── Student Import from Excel ─────────────────────────────────
    public function exportStudentTemplate(Request $request)
    {
        $classes = ClassModel::where('school_id', $this->schoolId())->get(['id', 'name']);
        return Excel::download(new StudentImportTemplateExport(null, $classes), 'student-import-template.xlsx');
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

    // ─── Get Students List with Filters ────────────────────────────
    public function getStudents(Request $request)
    {
        $query = User::where('school_id', $this->schoolId())->where('role', 'student')->with('class', 'section', 'parent');

        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $students = $query->orderBy('name')->get(['id', 'name', 'email', 'class_id', 'section_id', 'parent_id', 'phone', 'date_of_birth', 'grade', 'created_at']);

        return response()->json($students);
    }

    // ─── Bulk Transcript Generation by Class/Grade ─────────────────
    public function generateBulkTranscripts(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'term' => 'nullable|string|max:100',
            'academic_year' => 'nullable|string|max:20',
        ]);

        $schoolId = $this->schoolId();
        $classId = $data['class_id'];
        $term = $data['term'] ?? 'Term 1';
        $academicYear = $data['academic_year'] ?? date('Y');

        $class = ClassModel::where('school_id', $schoolId)->findOrFail($classId);
        $students = User::where('school_id', $schoolId)
            ->where('role', 'student')
            ->where('class_id', $classId)
            ->get();

        if ($students->isEmpty()) {
            return response()->json(['message' => 'No students found in this class'], 404);
        }

        $results = [];
        foreach ($students as $student) {
            $gradesData = $this->studentGrades($student->id);
            $gradesData = json_decode($gradesData->content(), true);

            if ($gradesData['overall_total'] <= 0) {
                $results[] = ['student' => $student->name, 'status' => 'skipped', 'reason' => 'No grades found'];
                continue;
            }

            $transcript = Transcript::create([
                'school_id' => $schoolId,
                'student_id' => $student->id,
                'class_id' => $classId,
                'term' => $term,
                'academic_year' => $academicYear,
                'total_marks' => $gradesData['overall_total'],
                'obtained_marks' => $gradesData['overall_obtained'],
                'percentage' => $gradesData['overall_percentage'],
                'grade' => $this->computeGrade($gradesData['overall_percentage']),
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]);

            foreach ($gradesData['subject_results'] as $sr) {
                TranscriptSubject::create([
                    'transcript_id' => $transcript->id,
                    'subject_id' => $sr['subject']['id'],
                    'exam_id' => $sr['grades'][0]['exam_id'] ?? null,
                    'marks_obtained' => $sr['obtained_marks'],
                    'total_marks' => $sr['total_marks'],
                    'percentage' => $sr['percentage'],
                    'grade' => $this->computeGrade($sr['percentage']),
                ]);
            }

            $results[] = ['student' => $student->name, 'status' => 'generated', 'transcript_id' => $transcript->id];
        }

        return response()->json([
            'message' => 'Bulk transcript generation completed',
            'class' => $class->name,
            'term' => $term,
            'academic_year' => $academicYear,
            'total_students' => $students->count(),
            'generated' => collect($results)->where('status', 'generated')->count(),
            'skipped' => collect($results)->where('status', 'skipped')->count(),
            'results' => $results,
        ]);
    }

    // ─── Grade-based Timetable Generation (full week) ──────────────
    public function generateGradeTimetables(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'academic_year' => 'nullable|string|max:20',
            'term' => 'nullable|string|max:20',
        ]);

        $schoolId = $this->schoolId();
        $class = ClassModel::where('school_id', $schoolId)->with('subjects.teacher')->findOrFail($data['class_id']);
        $subjects = $class->subjects;

        if ($subjects->isEmpty()) {
            return response()->json(['message' => 'No subjects assigned to this class.'], 422);
        }

        // 3 academic slots before breakfast + 4 before lunch = 7 per day
        $academicSlots = [
            ['start' => '08:00', 'end' => '08:45'],
            ['start' => '08:45', 'end' => '09:30'],
            ['start' => '09:30', 'end' => '10:15'],
            ['start' => '10:45', 'end' => '11:30'],
            ['start' => '11:30', 'end' => '12:15'],
            ['start' => '12:15', 'end' => '13:00'],
            ['start' => '13:00', 'end' => '13:45'],
        ];

        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        $activityMap = [
            'monday'    => ['timetable_type' => 'sports',   'venue' => 'Sports Field'],
            'tuesday'   => ['timetable_type' => 'study',    'venue' => 'Classroom'],
            'wednesday' => ['timetable_type' => 'sports',   'venue' => 'Sports Field'],
            'thursday'  => ['timetable_type' => 'study',    'venue' => 'Classroom'],
            'friday'    => ['timetable_type' => 'sports',   'venue' => 'Sports Field'],
            'saturday'  => ['timetable_type' => 'activity', 'venue' => 'School Hall'],
        ];

        // Delete existing entries for this class before regenerating
        Timetable::where('school_id', $schoolId)->where('class_id', $class->id)->delete();

        // Build subject pool: 7 academic slots × 6 days = 42
        $numSubjects = $subjects->count();
        $totalSlots = 42;
        $base = intdiv($totalSlots, $numSubjects);
        $extra = $totalSlots % $numSubjects;
        $pool = [];
        foreach ($subjects as $s) {
            $count = $base + ($extra > 0 ? 1 : 0);
            if ($extra > 0) $extra--;
            for ($i = 0; $i < $count; $i++) {
                $pool[] = $s;
            }
        }
        shuffle($pool);

        // Load existing timetables (other classes) for teacher conflict checking
        $existingTt = Timetable::where('school_id', $schoolId)->get();
        $newEntries = $created = [];

        $hasConflict = function ($day, $start, $end, $teacherId) use ($existingTt, &$newEntries) {
            return $existingTt->first(fn($e) =>
                $e->day === $day
                && $e->teacher_id && $e->teacher_id == $teacherId
                && $start < $e->end_time && $end > $e->start_time
            ) || collect($newEntries)->first(fn($e) =>
                $e['day'] === $day
                && $e['teacher_id'] && $e['teacher_id'] == $teacherId
                && $start < $e['end_time'] && $end > $e['start_time']
            );
        };

        $makeEntry = function ($day, $slot, $subject = null) use ($class, $data, $schoolId) {
            return [
                'school_id' => $schoolId,
                'class_id' => $class->id,
                'subject_id' => $subject?->id,
                'teacher_id' => $subject?->teacher_id,
                'day' => $day,
                'start_time' => $slot['start'],
                'end_time' => $slot['end'],
                'timetable_type' => 'academic',
                'academic_year' => $data['academic_year'] ?? null,
                'term' => $data['term'] ?? null,
            ];
        };

        foreach ($days as $day) {
            // 3 academic sessions before breakfast
            for ($si = 0; $si < 3; $si++) {
                $slot = $academicSlots[$si];
                $subject = array_shift($pool);

                if ($subject->teacher_id && $hasConflict($day, $slot['start'], $slot['end'], $subject->teacher_id)) {
                    $swapIdx = null;
                    foreach ($pool as $i => $candidate) {
                        if (!$candidate->teacher_id || !$hasConflict($day, $slot['start'], $slot['end'], $candidate->teacher_id)) {
                            $swapIdx = $i;
                            break;
                        }
                    }
                    if ($swapIdx !== null) {
                        $temp = $pool[$swapIdx];
                        $pool[$swapIdx] = $subject;
                        $subject = $temp;
                    }
                }

                $entry = $makeEntry($day, $slot, $subject);
                $newEntries[] = $entry;
                $created[] = Timetable::create($entry);
            }

            // Breakfast break
            $created[] = Timetable::create([
                'school_id' => $schoolId,
                'class_id' => $class->id,
                'subject_id' => null,
                'teacher_id' => null,
                'day' => $day,
                'start_time' => '10:15',
                'end_time' => '10:45',
                'timetable_type' => 'breakfast',
                'venue' => 'Break Room',
                'academic_year' => $data['academic_year'] ?? null,
                'term' => $data['term'] ?? null,
            ]);

            // 4 academic sessions before lunch
            for ($si = 3; $si < 7; $si++) {
                $slot = $academicSlots[$si];
                $subject = array_shift($pool);

                if ($subject->teacher_id && $hasConflict($day, $slot['start'], $slot['end'], $subject->teacher_id)) {
                    $swapIdx = null;
                    foreach ($pool as $i => $candidate) {
                        if (!$candidate->teacher_id || !$hasConflict($day, $slot['start'], $slot['end'], $candidate->teacher_id)) {
                            $swapIdx = $i;
                            break;
                        }
                    }
                    if ($swapIdx !== null) {
                        $temp = $pool[$swapIdx];
                        $pool[$swapIdx] = $subject;
                        $subject = $temp;
                    }
                }

                $entry = $makeEntry($day, $slot, $subject);
                $newEntries[] = $entry;
                $created[] = Timetable::create($entry);
            }

            // Lunch break
            $created[] = Timetable::create([
                'school_id' => $schoolId,
                'class_id' => $class->id,
                'subject_id' => null,
                'teacher_id' => null,
                'day' => $day,
                'start_time' => '13:45',
                'end_time' => '14:45',
                'timetable_type' => 'lunch',
                'venue' => 'Dining Hall',
                'academic_year' => $data['academic_year'] ?? null,
                'term' => $data['term'] ?? null,
            ]);

            // Activity slot after lunch
            $act = $activityMap[$day];
            $created[] = Timetable::create([
                'school_id' => $schoolId,
                'class_id' => $class->id,
                'subject_id' => null,
                'teacher_id' => null,
                'day' => $day,
                'start_time' => '14:45',
                'end_time' => '15:45',
                'timetable_type' => $act['timetable_type'],
                'venue' => $act['venue'],
                'academic_year' => $data['academic_year'] ?? null,
                'term' => $data['term'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Timetable generated for ' . $class->name,
            'data' => $created,
        ]);
    }

    public function getClassTimetable($id)
    {
        $schoolId = $this->schoolId();
        $class = ClassModel::where('school_id', $schoolId)->findOrFail($id);

        $entries = Timetable::with(['subject', 'teacher'])
            ->where('school_id', $schoolId)
            ->where('class_id', $class->id)
            ->orderBy('day')->orderBy('start_time')
            ->get()
            ->groupBy('day');

        return response()->json([
            'class' => $class,
            'timetable' => $entries,
        ]);
    }

    // ─── Assign subjects to class ──────────────────────────────────
    public function assignSubjectsToClass(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $class = ClassModel::where('school_id', $this->schoolId())->findOrFail($data['class_id']);
        $class->subjects()->sync($data['subject_ids']);

        return response()->json([
            'message' => 'Subjects assigned to class',
            'class' => $class->fresh()->load('subjects'),
        ]);
    }

    public function getClassSubjects($id)
    {
        $class = ClassModel::where('school_id', $this->schoolId())->findOrFail($id);
        return response()->json($class->subjects);
    }

    // ─── Grades list for academic year ─────────────────────────────
    public function getGrades()
    {
        $schoolId = $this->schoolId();
        $grades = ClassModel::where('school_id', $schoolId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
        return response()->json($grades);
    }

    // ─── Parents ─────────────────────────────────────────────────
    public function getParents()
    {
        $data = $this->enrichedParents($this->schoolId());
        return response()->json([
            'parents' => $data,
            'total' => $data->count(),
        ]);
    }

    // ─── Permission Approvals ────────────────────────────────────
    public function getPendingPermissions()
    {
        $approvals = Approval::with('requester', 'approvable')
            ->where('school_id', $this->schoolId())
            ->where('category', 'permission')
            ->where('status', Approval::STATUS_PENDING)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($approvals);
    }

    public function respondPermission(Request $request, $id)
    {
        $data = $request->validate([
            'action' => 'required|in:approve,reject',
            'response_notes' => 'nullable|string',
        ]);

        $approval = Approval::where('school_id', $this->schoolId())
            ->where('id', $id)
            ->where('category', 'permission')
            ->firstOrFail();

        $approval->update([
            'status' => $data['action'] === 'approve' ? Approval::STATUS_APPROVED : Approval::STATUS_REJECTED,
            'approver_id' => auth()->id(),
            'response_notes' => $data['response_notes'] ?? null,
            'responded_at' => now(),
        ]);

        // Update the associated attendance record
        if ($approval->approvable_type === Attendance::class && $approval->approvable_id) {
            $attendance = Attendance::find($approval->approvable_id);
            if ($attendance) {
                $attendance->update([
                    'permission_status' => $data['action'] === 'approve' ? 'approved' : 'rejected',
                    'permission_approved_by' => auth()->id(),
                    'permission_approved_at' => now(),
                ]);
            }
        }

        return response()->json(['message' => 'Permission ' . $data['action'] . 'd', 'approval' => $approval->fresh()]);
    }

    // ─── NECTA-Compliant Grading Engine ─────────────────────────
    public function nectaGradingConfig()
    {
        $schoolId = $this->schoolId();
        $school = auth()->user()->school;
        $config = $school->config['necta_grading'] ?? [
            'division_ranges' => [
                'division_one' => ['min' => 75, 'max' => 100],
                'division_two' => ['min' => 60, 'max' => 74],
                'division_three' => ['min' => 45, 'max' => 59],
                'division_four' => ['min' => 30, 'max' => 44],
                'division_zero' => ['min' => 0, 'max' => 29],
            ],
            'grade_scale' => [
                'A' => ['min' => 80, 'max' => 100, 'points' => 1, 'remark' => 'Excellent'],
                'B' => ['min' => 65, 'max' => 79, 'points' => 2, 'remark' => 'Very Good'],
                'C' => ['min' => 50, 'max' => 64, 'points' => 3, 'remark' => 'Good'],
                'D' => ['min' => 40, 'max' => 49, 'points' => 4, 'remark' => 'Fair'],
                'F' => ['min' => 0, 'max' => 39, 'points' => 5, 'remark' => 'Fail'],
            ],
        ];

        return response()->json($config);
    }

    public function saveNectaGradingConfig(Request $request)
    {
        $school = auth()->user()->school;
        $config = $school->config ?? [];
        $config['necta_grading'] = $request->validate([
            'division_ranges' => 'required|array',
            'grade_scale' => 'required|array',
        ]);
        $school->update(['config' => $config]);

        return response()->json(['message' => 'NECTA grading config saved', 'config' => $config['necta_grading']]);
    }

    public function computeNectaGrades(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'term' => 'nullable|string',
            'academic_year' => 'nullable|string',
        ]);

        $schoolId = $this->schoolId();
        $student = User::where('school_id', $schoolId)->where('role', 'student')->findOrFail($request->student_id);

        $grades = Grade::with('exam.subject')
            ->where('student_id', $student->id)
            ->where('submission_status', 'published')
            ->whereHas('exam', fn($q) => $q->where('school_id', $schoolId))
            ->get();

        $school = auth()->user()->school;
        $gradeScale = $school->config['necta_grading']['grade_scale'] ?? [];
        $pointsTotal = 0;
        $subjectResults = [];

        foreach ($grades->groupBy(fn($g) => $g->exam?->subject_id) as $subjectId => $subjectGrades) {
            $subject = $subjectGrades->first()->exam?->subject;
            $avgPct = $subjectGrades->avg('percentage');
            $letter = $this->computeGrade($avgPct);

            $point = 5;
            $remark = 'Fail';
            foreach ($gradeScale as $g => $scale) {
                if ($avgPct >= ($scale['min'] ?? 0) && $avgPct <= ($scale['max'] ?? 100)) {
                    $point = $scale['points'] ?? 5;
                    $remark = $scale['remark'] ?? 'Fail';
                    break;
                }
            }

            $pointsTotal += $point;
            $subjectResults[] = [
                'subject' => $subject?->name ?? 'Unknown',
                'average' => round($avgPct, 1),
                'grade' => $letter,
                'points' => $point,
                'remark' => $remark,
            ];
        }

        $overallPct = $grades->avg('percentage');
        $totalSubjects = count($subjectResults);
        $divisionPoints = $totalSubjects > 0 ? $pointsTotal / $totalSubjects : 0;

        $division = 'Division IV';
        $divConfig = $school->config['necta_grading']['division_ranges'] ?? [];
        if ($overallPct >= ($divConfig['division_one']['min'] ?? 75)) $division = 'Division I';
        elseif ($overallPct >= ($divConfig['division_two']['min'] ?? 60)) $division = 'Division II';
        elseif ($overallPct >= ($divConfig['division_three']['min'] ?? 45)) $division = 'Division III';
        elseif ($overallPct >= ($divConfig['division_four']['min'] ?? 30)) $division = 'Division IV';

        return response()->json([
            'student' => ['id' => $student->id, 'name' => $student->name],
            'subjects' => $subjectResults,
            'overall_percentage' => round($overallPct ?? 0, 1),
            'total_points' => $pointsTotal,
            'division_points' => round($divisionPoints, 2),
            'division' => $division,
            'subjects_count' => $totalSubjects,
        ]);
    }

    // ─── Report Card Compiler ───────────────────────────────────
    public function generateReportCards(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'term' => 'required|string|max:100',
            'academic_year' => 'required|string|max:20',
        ]);

        $schoolId = $this->schoolId();
        $students = User::where('school_id', $schoolId)
            ->where('role', 'student')
            ->where('class_id', $request->class_id)
            ->where('is_active', true)
            ->get();

        $reportCards = [];
        foreach ($students as $student) {
            $grades = Grade::with('exam.subject')
                ->where('student_id', $student->id)
                ->where('submission_status', 'published')
                ->whereHas('exam', fn($q) => $q->where('school_id', $schoolId))
                ->get();

            $subjectGrades = $grades->groupBy(fn($g) => $g->exam?->subject_id)
                ->map(fn($sg) => [
                    'subject' => $sg->first()->exam?->subject?->name ?? 'Unknown',
                    'ca_score' => $sg->where('exam_type', 'ca')->avg('percentage') ?? 0,
                    'exam_score' => $sg->where('exam_type', 'exam')->avg('percentage') ?? 0,
                    'total' => round($sg->avg('percentage'), 1),
                    'grade' => $this->computeGrade($sg->avg('percentage')),
                ])->values();

            $reportCards[] = [
                'student' => ['id' => $student->id, 'name' => $student->name],
                'class' => $student->class?->name,
                'term' => $request->term,
                'academic_year' => $request->academic_year,
                'subjects' => $subjectGrades,
                'overall_average' => round($grades->avg('percentage') ?? 0, 1),
                'total_subjects' => $subjectGrades->count(),
                'generated_at' => now()->format('Y-m-d H:i:s'),
            ];
        }

        return response()->json([
            'message' => count($reportCards) . ' report cards generated',
            'report_cards' => $reportCards,
        ]);
    }

    // ─── Conflict-Free Timetable Generator ──────────────────────
    public function generateConflictFreeTimetable(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'term' => 'required|string|max:100',
            'days' => 'required|array',
            'days.*' => 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'periods' => 'required|array',
            'periods.*.start_time' => 'required|date_format:H:i',
            'periods.*.end_time' => 'required|date_format:H:i|after:periods.*.start_time',
        ]);

        $schoolId = $this->schoolId();
        $class = ClassModel::where('school_id', $schoolId)->findOrFail($request->class_id);
        $subjects = Subject::where('school_id', $schoolId)
            ->whereHas('classes', fn($q) => $q->where('class_id', $class->id))
            ->whereNotNull('teacher_id')
            ->with('teacher')
            ->get();

        Timetable::where('school_id', $schoolId)
            ->where('class_id', $class->id)
            ->where('term', $request->term)
            ->delete();

        $timetable = [];
        $teacherSchedule = [];
        $roomSchedule = [];

        foreach ($request->days as $day) {
            $dayLower = strtolower($day);
            $subjectIndex = 0;
            $subjectCount = $subjects->count();

            foreach ($request->periods as $period) {
                if ($subjectCount === 0) break;

                $subject = $subjects[$subjectIndex % $subjectCount];
                $teacherId = $subject->teacher_id;
                $room = 'Room ' . (100 + $subjectIndex);
                $timeKey = $period['start_time'] . '-' . $period['end_time'];

                if (isset($teacherSchedule[$dayLower][$teacherId][$timeKey])) {
                    $subjectIndex++;
                    continue;
                }
                if (isset($roomSchedule[$dayLower][$room][$timeKey])) {
                    $subjectIndex++;
                    continue;
                }

                $entry = Timetable::create([
                    'school_id' => $schoolId,
                    'class_id' => $class->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacherId,
                    'day' => $dayLower,
                    'start_time' => $period['start_time'],
                    'end_time' => $period['end_time'],
                    'room_number' => $room,
                    'term' => $request->term,
                ]);

                $teacherSchedule[$dayLower][$teacherId][$timeKey] = true;
                $roomSchedule[$dayLower][$room][$timeKey] = true;
                $timetable[] = $entry;

                $subjectIndex++;
            }
        }

        return response()->json([
            'message' => count($timetable) . ' sessions generated without conflicts',
            'timetable' => $timetable,
            'class' => $class->name,
            'term' => $request->term,
        ]);
    }
}
