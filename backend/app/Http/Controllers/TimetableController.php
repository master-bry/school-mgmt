<?php

namespace App\Http\Controllers;

use App\Models\Timetable;
use App\Models\ClassModel;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function studentTimetable()
    {
        $student = auth()->user();
        
        if (!$student->class_id) {
            return response()->json([
                'message' => 'No class assigned to student',
            ], 404);
        }

        $timetable = Timetable::where('class_id', $student->class_id)
            ->with('subject', 'teacher')
            ->orderBy('day')
            ->orderBy('start_time')
            ->get()
            ->groupBy('day');

        return response()->json($timetable);
    }
}
