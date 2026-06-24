<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Grade;
use App\Models\GradeSubmission;
use App\Models\User;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with('subject', 'class');
        
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $exams = $query->orderBy('exam_date', 'desc')->get();
        return response()->json($exams);
    }

    public function storeGrades(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:users,id',
            'grades.*.marks_obtained' => 'required|numeric|min:0',
        ]);

        $exam = Exam::findOrFail($request->exam_id);

        foreach ($request->grades as $gradeData) {
            $percentage = ($gradeData['marks_obtained'] / $exam->total_marks) * 100;
            $grade = $this->calculateGrade($percentage);

            Grade::updateOrCreate(
                [
                    'exam_id' => $request->exam_id,
                    'student_id' => $gradeData['student_id'],
                ],
                [
                    'marks_obtained' => $gradeData['marks_obtained'],
                    'percentage' => $percentage,
                    'grade' => $grade,
                    'graded_by' => auth()->id(),
                ]
            );
        }

        return response()->json([
            'message' => 'Grades recorded successfully',
        ]);
    }

    private function calculateGrade($percentage)
    {
        if ($percentage >= 90) return 'A+';
        if ($percentage >= 80) return 'A';
        if ($percentage >= 70) return 'B+';
        if ($percentage >= 60) return 'B';
        if ($percentage >= 50) return 'C';
        if ($percentage >= 40) return 'D';
        return 'F';
    }

    public function studentGrades()
    {
        $student = auth()->user();
        $grades = $student->grades()
            ->with('exam.subject', 'exam.class')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($grades);
    }

    public function submitGrades(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
        ]);

        $exam = Exam::findOrFail($request->exam_id);

        $existing = GradeSubmission::where('exam_id', $exam->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Grades already submitted for this exam'], 422);
        }

        $submission = GradeSubmission::create([
            'school_id' => auth()->user()->school_id,
            'exam_id' => $exam->id,
            'subject_id' => $exam->subject_id,
            'class_id' => $exam->class_id,
            'submitted_by' => auth()->id(),
            'status' => 'pending',
        ]);

        Grade::where('exam_id', $exam->id)
            ->update(['submission_status' => 'submitted']);

        return response()->json(['message' => 'Grades submitted for review', 'submission' => $submission], 201);
    }
}
