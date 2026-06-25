<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Fee;
use App\Models\Event;
use App\Models\Announcement;
use App\Models\ParentNotification;
use Illuminate\Http\Request;

class ParentController extends Controller
{
    public function dashboard()
    {
        $parent = auth()->user();
        $children = $parent->children()->with('class', 'school')->get();
        $childIds = $children->pluck('id');

        // Bulk-load all data before the loop to avoid N+1
        $attendances = \App\Models\Attendance::whereIn('student_id', $childIds)->get();
        $grades = \App\Models\Grade::whereIn('student_id', $childIds)->with('exam.subject')->latest()->get();
        $allFees = \App\Models\Fee::whereIn('student_id', $childIds)->orderBy('due_date', 'desc')->get();

        $childrenData = $children->map(function ($child) use ($attendances, $grades, $allFees) {
            $childAtt = $attendances->where('student_id', $child->id);
            $todayAtt = $childAtt->first(fn($a) => $a->date && $a->date->toDateString() === today()->toDateString());

            $attendanceStats = [
                'present' => $childAtt->where('status', 'present')->count(),
                'absent' => $childAtt->where('status', 'absent')->count(),
                'late' => $childAtt->where('status', 'late')->count(),
                'today_status' => $todayAtt?->status ?? 'not_marked',
            ];
            $childGrades = $grades->where('student_id', $child->id);
            $averageGrade = $childGrades->avg('percentage');
            $latestGrades = $childGrades->sortByDesc('created_at')->take(5)->values();

            $fees = $allFees->where('student_id', $child->id);
            $pendingFees = $fees->whereIn('status', ['pending', 'overdue'])->sum('amount') -
                $fees->whereIn('status', ['pending', 'overdue'])->sum('paid_amount');

            return [
                'user' => $child,
                'attendance_stats' => $attendanceStats,
                'average_grade' => round($averageGrade ?? 0, 2),
                'latest_grades' => $latestGrades,
                'fees' => $fees->values(),
                'pending_fees' => round(max(0, $pendingFees), 2),
                'total_fees' => $fees->sum('amount'),
                'paid_fees' => $fees->sum('paid_amount'),
            ];
        });

        // Upcoming events for parent visibility
        $upcomingEvents = Event::where('school_id', $parent->school_id)
            ->where('is_public', true)
            ->where('event_date', '>=', now())
            ->orderBy('event_date')
            ->take(5)
            ->get();

        return response()->json([
            'parent' => $parent,
            'children' => $childrenData,
            'upcoming_events' => $upcomingEvents,
            'announcements' => Announcement::where('school_id', $parent->school_id)
                ->where('is_public', true)->latest()->take(3)->get(),
        ]);
    }

    public function childAttendance($id)
    {
        $child = User::where('id', $id)->where('parent_id', auth()->id())->firstOrFail();
        return response()->json(
            $child->attendances()->with('class', 'student')->orderBy('date', 'desc')->paginate(30)
        );
    }

    public function childGrades($id)
    {
        $child = User::where('id', $id)->where('parent_id', auth()->id())->firstOrFail();
        return response()->json(
            $child->grades()->with('exam.subject', 'exam.class', 'student')->orderBy('created_at', 'desc')->get()
        );
    }

    public function childFees($id)
    {
        $child = User::where('id', $id)->where('parent_id', auth()->id())->firstOrFail();
        return response()->json(
            $child->fees()->where('approval_status', 'approved')->orderBy('due_date', 'desc')->get()
        );
    }

    // ─── SMS Notifications (Tanzanian SMS Gateway) ──────────────
    public function notifications()
    {
        $parent = auth()->user();
        return response()->json(
            ParentNotification::where('parent_id', $parent->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20)
        );
    }

    public function markNotificationRead($id)
    {
        $notification = ParentNotification::where('parent_id', auth()->id())->findOrFail($id);
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Notification marked as read']);
    }

    // ─── Fee Payment Portal ─────────────────────────────────────
    public function paymentPortal()
    {
        $parent = auth()->user();
        $children = $parent->children()->pluck('id');

        $outstanding = Fee::whereIn('student_id', $children)
            ->whereIn('status', ['pending', 'partial', 'overdue'])
            ->with('student:id,name,class_id')
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json([
            'outstanding_fees' => $outstanding,
            'total_outstanding' => $outstanding->sum(fn($f) => max(0, $f->amount - $f->paid_amount)),
        ]);
    }

    public function generateControlNumber(Request $request)
    {
        $request->validate(['fee_id' => 'required|exists:fees,id']);

        $fee = Fee::findOrFail($request->fee_id);
        $child = User::find($fee->student_id);

        if (!$child || $child->parent_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Simulate GePG/M-Pesa control number generation
        $controlNumber = 'GEPG' . now()->format('Ymd') . str_pad($fee->id, 8, '0', STR_PAD_LEFT);

        return response()->json([
            'control_number' => $controlNumber,
            'amount' => $fee->amount - $fee->paid_amount,
            'payer_name' => auth()->user()->name,
            'reference' => 'FEE-' . $fee->id,
            'expires_at' => now()->addDays(3)->format('Y-m-d H:i:s'),
        ]);
    }
}
