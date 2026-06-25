<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Announcement;
use App\Models\ClassModel;
use App\Models\Exam;
use App\Models\Timetable;
use App\Models\Attendance;
use Illuminate\Http\Request;

class SecretaryController extends Controller
{
    private function schoolId() { return auth()->user()->school_id; }

    public function dashboard()
    {
        $schoolId = $this->schoolId();
        $today = today();

        return response()->json([
            'total_users' => User::where('school_id', $schoolId)->count(),
            'total_students' => User::where('school_id', $schoolId)->where('role', 'student')->count(),
            'total_staff' => User::where('school_id', $schoolId)->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])->count(),
            'total_announcements' => Announcement::where('school_id', $schoolId)->count(),
            'today_exams' => Exam::where('school_id', $schoolId)->whereDate('exam_date', $today)->count(),
            'today_attendances_marked' => Attendance::where('school_id', $schoolId)->whereDate('date', $today)->count(),
            'recent_announcements' => Announcement::where('school_id', $schoolId)->with('createdBy')->latest()->take(5)->get(),
            'today_timetable' => Timetable::where('school_id', $schoolId)
                ->where('day', strtolower(now()->format('l')))
                ->with(['class', 'subject', 'teacher'])
                ->orderBy('start_time')->get(),
        ]);
    }

    public function announcements()
    {
        return response()->json(
            Announcement::where('school_id', $this->schoolId())->with('createdBy')->latest()->get()
        );
    }

    public function storeAnnouncement(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|string|max:100',
            'is_public' => 'boolean',
        ]);
        $announcement = Announcement::create([
            'school_id' => $this->schoolId(),
            'title' => $data['title'],
            'content' => $data['content'],
            'category' => $data['category'] ?? 'general',
            'is_public' => $data['is_public'] ?? false,
            'created_by' => auth()->id(),
        ]);
        return response()->json($announcement->load('createdBy'), 201);
    }

    public function users()
    {
        return response()->json(
            User::where('school_id', $this->schoolId())->with('class')->get(['id', 'name', 'email', 'role', 'phone', 'is_active'])
        );
    }

    public function storeUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:teacher,student,parent,academician,cashier,secretary',
            'phone' => 'nullable|string|max:20',
        ]);
        $data['school_id'] = $this->schoolId();
        $data['password'] = bcrypt($data['password']);
        return response()->json(User::create($data), 201);
    }

    public function timetables()
    {
        return response()->json(
            Timetable::with(['class', 'subject', 'teacher'])
                ->where('school_id', $this->schoolId())->orderBy('day')->orderBy('start_time')->get()
        );
    }

    public function exams()
    {
        return response()->json(
            Exam::with(['subject', 'class'])->where('school_id', $this->schoolId())->get()
        );
    }
}
