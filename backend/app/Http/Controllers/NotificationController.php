<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use App\Models\Approval;
use App\Models\GradeSubmission;
use App\Models\ParentNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $schoolId = $user->school_id;
        $role = $user->role;

        $notifications = [];

        switch ($role) {
            case 'parent':
                $records = ParentNotification::where('parent_id', $user->id)
                    ->orderBy('created_at', 'desc')->paginate(20);
                return response()->json($records);

            case 'head_of_school':
                $pendingFees = Fee::where('school_id', $schoolId)
                    ->where('approval_status', 'pending_hos')->count();
                if ($pendingFees > 0) {
                    $notifications[] = [
                        'id' => 'hos_pending_fees',
                        'title' => 'Pending Fee Approvals',
                        'message' => "You have {$pendingFees} fee approval(s) waiting.",
                        'type' => 'fee_approval',
                        'action' => '/dashboard/head-of-school/fees',
                        'created_at' => now(),
                        'read_at' => null,
                    ];
                }

                $pendingSalaries = Approval::where('school_id', $schoolId)
                    ->whereIn('category', ['salary', 'bonus'])
                    ->where('status', 'pending')->count();
                if ($pendingSalaries > 0) {
                    $notifications[] = [
                        'id' => 'hos_pending_salary',
                        'title' => 'Pending Salary/Bonus Approvals',
                        'message' => "You have {$pendingSalaries} salary/bonus approval(s) waiting.",
                        'type' => 'salary_approval',
                        'action' => '/dashboard/head-of-school/approvals',
                        'created_at' => now(),
                        'read_at' => null,
                    ];
                }

                $pendingSubmissions = GradeSubmission::where('school_id', $schoolId)
                    ->whereIn('status', ['forwarded', 'pending', 'reviewed'])->count();
                if ($pendingSubmissions > 0) {
                    $notifications[] = [
                        'id' => 'hos_pending_submissions',
                        'title' => 'Pending Grade Submissions',
                        'message' => "You have {$pendingSubmissions} grade submission(s) to review.",
                        'type' => 'grade_submission',
                        'action' => '/dashboard/head-of-school/approvals',
                        'created_at' => now(),
                        'read_at' => null,
                    ];
                }
                break;

            case 'assistant_head':
                $pendingFees = Fee::where('school_id', $schoolId)
                    ->where('approval_status', 'pending_cashier')->count();
                if ($pendingFees > 0) {
                    $notifications[] = [
                        'id' => 'ah_pending_fees',
                        'title' => 'Pending Fee Reviews',
                        'message' => "You have {$pendingFees} fee(s) to review.",
                        'type' => 'fee_review',
                        'action' => '/dashboard/assistant-head/fees',
                        'created_at' => now(),
                        'read_at' => null,
                    ];
                }
                break;

            case 'cashier':
                $pendingFees = Fee::where('school_id', $schoolId)
                    ->where('approval_status', 'pending_cashier')->count();
                if ($pendingFees > 0) {
                    $notifications[] = [
                        'id' => 'cashier_pending_fees',
                        'title' => 'Pending Fee Invoices',
                        'message' => "{$pendingFees} fee invoice(s) pending cashier review.",
                        'type' => 'fee_invoice',
                        'action' => '/dashboard/cashier/fees',
                        'created_at' => now(),
                        'read_at' => null,
                    ];
                }
                break;

            case 'teacher':
                $pendingGrades = GradeSubmission::where('school_id', $schoolId)
                    ->where('submitted_by', $user->id)
                    ->whereIn('status', ['forwarded', 'pending'])->count();
                if ($pendingGrades > 0) {
                    $notifications[] = [
                        'id' => 'teacher_pending_grades',
                        'title' => 'Pending Grade Submissions',
                        'message' => "You have {$pendingGrades} grade submission(s) awaiting approval.",
                        'type' => 'grade_submission',
                        'action' => '/dashboard/grades',
                        'created_at' => now(),
                        'read_at' => null,
                    ];
                }
                break;
        }

        return response()->json([
            'data' => $notifications,
            'total' => count($notifications),
        ]);
    }

    public function markRead($id)
    {
        $user = auth()->user();

        if ($user->role === 'parent') {
            $notification = ParentNotification::where('parent_id', $user->id)->find($id);
            if ($notification) {
                $notification->update(['read_at' => now()]);
                return response()->json(['message' => 'Notification marked as read']);
            }
        }

        return response()->json(['message' => 'Dismissed'], 200);
    }
}
