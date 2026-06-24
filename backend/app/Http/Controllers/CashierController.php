<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Fee;
use App\Models\School;
use App\Models\TeacherDetail;
use App\Models\Approval;
use Illuminate\Http\Request;

class CashierController extends Controller
{
    use \App\Models\Traits\ParentEnrichment;

    private function schoolId() { return auth()->user()->school_id; }

    public function dashboard()
    {
        $schoolId = $this->schoolId();
        $feesQuery = Fee::where('school_id', $schoolId);

        // Revenue automation - collections vs outstanding
        $totalCollected = $feesQuery->sum('paid_amount');
        $totalOutstanding = Fee::where('school_id', $schoolId)
            ->selectRaw("SUM(GREATEST(0, amount - paid_amount)) as total")
            ->value('total') ?? 0;
        $totalOverdue = $feesQuery->where('status', 'overdue')->sum('amount');

        // Aging debt analysis
        $agingDebt = [
            '0_30_days' => Fee::where('school_id', $schoolId)->where('status', 'pending')
                ->where('due_date', '>=', now()->subDays(30))->sum('amount'),
            '31_60_days' => Fee::where('school_id', $schoolId)->where('status', 'pending')
                ->where('due_date', '<', now()->subDays(30))->where('due_date', '>=', now()->subDays(60))->sum('amount'),
            '61_plus_days' => Fee::where('school_id', $schoolId)->whereIn('status', ['overdue', 'pending'])
                ->where('due_date', '<', now()->subDays(60))->sum('amount'),
        ];

        // Monthly collections
        $monthlyCollections = Fee::where('school_id', $schoolId)
            ->whereNotNull('paid_date')
            ->where('paid_date', '>=', now()->subMonths(12))
            ->selectRaw("to_char(paid_date, 'YYYY-MM') as month, sum(paid_amount) as total")
            ->groupBy('month')->orderBy('month')->get();

        // Daily collections last 30 days
        $dailyCollections = Fee::where('school_id', $schoolId)
            ->whereNotNull('paid_date')->where('paid_date', '>=', now()->subDays(30))
            ->selectRaw("DATE(paid_date) as date, sum(paid_amount) as total")
            ->groupBy('date')->orderBy('date')->get();

        // By category
        $byCategory = Fee::where('school_id', $schoolId)
            ->selectRaw("fee_category, count(*) as count, sum(amount) as total, sum(paid_amount) as collected")
            ->groupBy('fee_category')->get();

        // By grade/class
        $byGrade = Fee::where('school_id', $schoolId)->whereNotNull('grade')
            ->selectRaw("grade, count(*) as count, sum(amount) as total, sum(paid_amount) as collected")
            ->groupBy('grade')->get();

        // By payment method
        $byMethod = Fee::where('school_id', $schoolId)->whereNotNull('payment_method')
            ->selectRaw("payment_method, count(*) as count, sum(paid_amount) as total")
            ->groupBy('payment_method')->get();

        // Status breakdown
        $byStatus = [
            'paid' => Fee::where('school_id', $schoolId)->where('status', 'paid')->count(),
            'partial' => Fee::where('school_id', $schoolId)->where('status', 'partial')->count(),
            'pending' => Fee::where('school_id', $schoolId)->where('status', 'pending')->count(),
            'overdue' => Fee::where('school_id', $schoolId)->where('status', 'overdue')->count(),
        ];

        $totalCreated = Fee::where('school_id', $schoolId)->sum('amount');
        $efficiency = $totalCreated > 0 ? round(($totalCollected / $totalCreated) * 100, 1) : 0;

        return response()->json([
            'total_collected' => $totalCollected,
            'total_pending' => Fee::where('school_id', $schoolId)->where('status', 'pending')->sum('amount'),
            'total_overdue' => $totalOverdue,
            'total_outstanding' => $totalOutstanding,
            'collection_efficiency' => $efficiency,
            'aging_debt' => $agingDebt,
            'students_count' => User::where('school_id', $schoolId)->where('role', 'student')->count(),
            'total_invoices' => Fee::where('school_id', $schoolId)->count(),
            'paid_invoices' => Fee::where('school_id', $schoolId)->where('status', 'paid')->count(),
            'recent_transactions' => Fee::where('school_id', $schoolId)->with('student')->latest()->take(10)->get(),
            'classes' => ClassModel::where('school_id', $schoolId)->get(['id', 'name', 'section']),
            'chart_data' => [
                'monthly_collections' => $monthlyCollections,
                'daily_collections' => $dailyCollections,
                'by_category' => $byCategory,
                'by_grade' => $byGrade,
                'by_payment_method' => $byMethod,
                'by_status' => $byStatus,
            ],
        ]);
    }

    public function fees()
    {
        return response()->json(Fee::with('student')
            ->where('school_id', $this->schoolId())
            ->orderBy('created_at', 'desc')
            ->get());
    }

    public function pendingFees()
    {
        return response()->json(Fee::with('student')
            ->where('school_id', $this->schoolId())
            ->whereIn('approval_status', ['pending_cashier', 'pending_hos'])
            ->orderBy('created_at', 'desc')
            ->get());
    }

    public function storeFee(Request $request)
    {
        $data = $request->validate([
            'fee_type' => 'required|string|max:255',
            'fee_category' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        $fees = [];
        $defaults = ['type' => 'fee', 'approval_status' => 'pending_cashier', 'status' => 'pending'];
        if ($request->applies_to === 'all') {
            $students = User::where('school_id', $this->schoolId())->where('role', 'student')->where('is_active', true)->get();
            foreach ($students as $student) {
                $fees[] = Fee::create(array_merge($data, $defaults, ['school_id' => $this->schoolId(), 'student_id' => $student->id, 'applies_to' => 'all']));
            }
        } elseif ($request->applies_to === 'grade' && $request->grade) {
            $students = User::where('school_id', $this->schoolId())->where('role', 'student')->where('is_active', true)
                ->whereHas('class', fn($q) => $q->where('name', $request->grade))->get();
            foreach ($students as $student) {
                $fees[] = Fee::create(array_merge($data, $defaults, ['school_id' => $this->schoolId(), 'student_id' => $student->id, 'grade' => $request->grade, 'applies_to' => 'grade']));
            }
        } else {
            $request->validate(['student_id' => 'required|exists:users,id']);
            $fees[] = Fee::create(array_merge($data, $defaults, ['school_id' => $this->schoolId(), 'student_id' => $request->student_id, 'applies_to' => 'student']));
        }

        return response()->json(['message' => count($fees) . ' fee(s) created pending approval', 'fees' => $fees], 201);
    }

    public function storeFine(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:users,id',
            'fee_type' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
        ]);
        $fee = Fee::create([
            'school_id' => $this->schoolId(), 'student_id' => $data['student_id'],
            'fee_type' => $data['fee_type'], 'type' => 'fine',
            'amount' => $data['amount'], 'due_date' => $data['due_date'],
            'applies_to' => 'student', 'status' => 'pending',
            'approval_status' => 'pending_cashier',
        ]);
        return response()->json($fee, 201);
    }

    public function recordPayment(Request $request, $id)
    {
        $fee = Fee::where('school_id', $this->schoolId())->findOrFail($id);
        $data = $request->validate(['paid_amount' => 'required|numeric|min:0', 'paid_date' => 'required|date', 'payment_method' => 'required|string', 'transaction_id' => 'nullable|string']);
        $fee->update($data);
        $fee->status = $fee->paid_amount >= $fee->amount ? 'paid' : ($fee->paid_amount > 0 ? 'partial' : $fee->status);
        $fee->save();
        return response()->json(['message' => 'Payment recorded', 'fee' => $fee->fresh()->load('student')]);
    }

    public function reports()
    {
        $schoolId = $this->schoolId();
        return response()->json([
            'total_fees_created' => Fee::where('school_id', $schoolId)->sum('amount'),
            'total_collected' => Fee::where('school_id', $schoolId)->sum('paid_amount'),
            'total_outstanding' => Fee::where('school_id', $schoolId)->get()->sum(fn($f) => max(0, $f->amount - $f->paid_amount)),
            'by_status' => [
                'paid' => Fee::where('school_id', $schoolId)->where('status', 'paid')->count(),
                'partial' => Fee::where('school_id', $schoolId)->where('status', 'partial')->count(),
                'pending' => Fee::where('school_id', $schoolId)->where('status', 'pending')->count(),
                'overdue' => Fee::where('school_id', $schoolId)->where('status', 'overdue')->count(),
            ],
            'by_category' => Fee::where('school_id', $schoolId)->selectRaw('fee_category, sum(amount) as total, sum(paid_amount) as collected')->groupBy('fee_category')->get(),
        ]);
    }

    public function students()
    {
        return response()->json(
            User::where('school_id', $this->schoolId())->where('role', 'student')
                ->with('class')->get(['id', 'name', 'email', 'class_id'])
        );
    }

    // ─── Staff Salary / Bonus Management ────────────────────────
    public function getStaff()
    {
        return response()->json(
            User::where('school_id', $this->schoolId())
                ->whereIn('role', ['admin', 'head_of_school', 'assistant_head', 'teacher', 'academician', 'cashier', 'secretary'])
                ->with('teacherDetail')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'phone', 'is_active'])
        );
    }

    public function updateStaffInfo(Request $request, $id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->findOrFail($id);

        $data = $request->validate([
            'salary' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:255',
            'bank_code' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'date_joined' => 'nullable|date',
        ]);

        $detail = $staff->teacherDetail;
        $fields = array_filter($data, fn($v) => $v !== null);
        if ($detail) {
            $detail->update($fields);
        } else {
            $staff->teacherDetail()->create($fields);
        }

        return response()->json(['message' => 'Staff info updated', 'staff' => $staff->fresh()->load('teacherDetail')]);
    }

    public function updateStaffSalary(Request $request, $id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->findOrFail($id);
        $data = $request->validate(['salary' => 'required|numeric|min:0']);

        $detail = $staff->teacherDetail;
        if ($detail) {
            $detail->update(['salary' => $data['salary'], 'salary_approved_by' => null]);
        } else {
            $staff->teacherDetail()->create(['salary' => $data['salary']]);
        }

        Approval::create([
            'school_id' => $this->schoolId(),
            'category' => 'salary',
            'title' => 'Salary Update: ' . $staff->name,
            'description' => 'Updated salary to $' . number_format($data['salary'], 2),
            'requester_id' => auth()->id(),
            'approvable_type' => TeacherDetail::class,
            'approvable_id' => $staff->teacherDetail->id,
            'status' => Approval::STATUS_PENDING,
        ]);

        return response()->json(['message' => 'Salary updated, pending approval', 'staff' => $staff->fresh()->load('teacherDetail')]);
    }

    public function updateStaffBonus(Request $request, $id)
    {
        $staff = User::where('school_id', $this->schoolId())
            ->findOrFail($id);
        $data = $request->validate(['bonus' => 'required|numeric|min:0']);

        $detail = $staff->teacherDetail;
        if ($detail) {
            $detail->update(['bonus' => $data['bonus'], 'bonus_approved_by' => null]);
        } else {
            $staff->teacherDetail()->create(['bonus' => $data['bonus']]);
        }

        Approval::create([
            'school_id' => $this->schoolId(),
            'category' => 'bonus',
            'title' => 'Bonus Update: ' . $staff->name,
            'description' => 'Updated bonus to $' . number_format($data['bonus'], 2),
            'requester_id' => auth()->id(),
            'approvable_type' => TeacherDetail::class,
            'approvable_id' => $staff->teacherDetail->id,
            'status' => Approval::STATUS_PENDING,
        ]);

        return response()->json(['message' => 'Bonus updated, pending approval', 'staff' => $staff->fresh()->load('teacherDetail')]);
    }

    // ─── Parent Fees ────────────────────────────────────────────
    public function getParents()
    {
        $data = $this->enrichedParents($this->schoolId());
        return response()->json([
            'parents' => $data,
            'total' => $data->count(),
        ]);
    }

    public function sendFeeReminder(Request $request)
    {
        $request->validate([
            'parent_id' => 'required|exists:users,id',
            'message' => 'nullable|string',
        ]);

        $parent = User::findOrFail($request->parent_id);
        if ($parent->role !== 'parent') {
            return response()->json(['message' => 'User is not a parent'], 422);
        }

        $notification = \App\Models\ParentNotification::create([
            'school_id' => $this->schoolId(),
            'parent_id' => $parent->id,
            'type' => 'fee_reminder',
            'title' => 'Fee Payment Reminder',
            'message' => $request->message ?? 'Please ensure your children\'s fees are paid on time.',
            'related_entity_type' => 'fee',
            'sent_at' => now(),
        ]);

        return response()->json([
            'message' => 'Fee reminder sent successfully',
            'notification' => $notification,
        ]);
    }

    // ─── Bulk Invoice Generation (PRD Cashier Feature) ─────────
    public function bulkGenerateFees(Request $request)
    {
        $data = $request->validate([
            'fee_type' => 'required|string|max:255',
            'fee_category' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'applies_to' => 'required|in:all,grade,class',
            'grade' => 'required_if:applies_to,grade|nullable|string',
            'class_id' => 'required_if:applies_to,class|nullable|exists:classes,id',
        ]);

        $students = User::where('school_id', $this->schoolId())
            ->where('role', 'student')
            ->where('is_active', true);

        if ($data['applies_to'] === 'grade' && $data['grade']) {
            $students->whereHas('class', fn($q) => $q->where('name', $data['grade']));
        } elseif ($data['applies_to'] === 'class' && $data['class_id']) {
            $students->where('class_id', $data['class_id']);
        }

        $created = [];
        $defaults = [
            'school_id' => $this->schoolId(),
            'fee_type' => $data['fee_type'],
            'fee_category' => $data['fee_category'],
            'amount' => $data['amount'],
            'due_date' => $data['due_date'],
            'type' => 'fee',
            'status' => 'pending',
            'approval_status' => 'pending_cashier',
        ];

        foreach ($students->get() as $student) {
            $created[] = Fee::create(array_merge($defaults, [
                'student_id' => $student->id,
                'grade' => $data['applies_to'] === 'grade' ? $data['grade'] : null,
            ]));
        }

        return response()->json([
            'message' => count($created) . ' invoices generated',
            'count' => count($created),
            'fees' => $created,
        ], 201);
    }

    // ─── Invoice Listing ────────────────────────────────────────
    public function invoices()
    {
        return response()->json(
            Fee::with('student:id,name,class_id')
                ->where('school_id', $this->schoolId())
                ->orderBy('created_at', 'desc')
                ->paginate(50)
        );
    }

    // ─── Automated Receipt Generation ──────────────────────────
    public function generateReceipt(Request $request, $id)
    {
        $fee = Fee::where('school_id', $this->schoolId())->findOrFail($id);

        if ($fee->paid_amount <= 0) {
            return response()->json(['message' => 'No payment recorded for this fee'], 422);
        }

        $receipt = [
            'receipt_number' => 'RCT-' . now()->format('Ymd') . '-' . str_pad($fee->id, 6, '0', STR_PAD_LEFT),
            'school' => auth()->user()->school?->name,
            'student' => $fee->student?->name,
            'fee_type' => $fee->fee_type,
            'amount' => $fee->amount,
            'paid_amount' => $fee->paid_amount,
            'balance' => max(0, $fee->amount - $fee->paid_amount),
            'payment_method' => $fee->payment_method,
            'paid_date' => $fee->paid_date?->format('Y-m-d H:i:s'),
            'transaction_id' => $fee->transaction_id,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];

        return response()->json([
            'message' => 'Receipt generated',
            'receipt' => $receipt,
        ]);
    }

    // ─── Debtors Aging Ledger ──────────────────────────────────
    public function debtorsAging()
    {
        $schoolId = $this->schoolId();

        $aging = [
            'current' => Fee::where('school_id', $schoolId)
                ->where('status', 'pending')
                ->where('due_date', '>=', now())->sum('amount'),
            '1_30_days' => Fee::where('school_id', $schoolId)
                ->whereIn('status', ['pending', 'overdue'])
                ->where('due_date', '<', now())
                ->where('due_date', '>=', now()->subDays(30))->sum('amount'),
            '31_60_days' => Fee::where('school_id', $schoolId)
                ->whereIn('status', ['pending', 'overdue'])
                ->where('due_date', '<', now()->subDays(30))
                ->where('due_date', '>=', now()->subDays(60))->sum('amount'),
            '61_90_days' => Fee::where('school_id', $schoolId)
                ->whereIn('status', ['pending', 'overdue'])
                ->where('due_date', '<', now()->subDays(60))
                ->where('due_date', '>=', now()->subDays(90))->sum('amount'),
            '90_plus_days' => Fee::where('school_id', $schoolId)
                ->whereIn('status', ['pending', 'overdue'])
                ->where('due_date', '<', now()->subDays(90))->sum('amount'),
        ];

        $topDebtors = Fee::where('school_id', $schoolId)
            ->whereIn('status', ['pending', 'overdue'])
            ->selectRaw("student_id, sum(amount - paid_amount) as outstanding")
            ->groupBy('student_id')
            ->orderBy('outstanding', 'desc')
            ->take(10)
            ->with('student:id,name,class_id')
            ->get();

        return response()->json([
            'aging' => $aging,
            'total_outstanding' => array_sum($aging),
            'top_debtors' => $topDebtors,
        ]);
    }

    // ─── Bulk Reminder Notifications ────────────────────────────
    public function sendBulkReminders(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:users,id',
            'message' => 'nullable|string',
        ]);

        $sent = 0;
        foreach ($request->student_ids as $studentId) {
            $student = User::find($studentId);
            if (!$student || $student->school_id !== $this->schoolId()) continue;

            $parent = $student->parent;
            if (!$parent) continue;

            ParentNotification::create([
                'school_id' => $this->schoolId(),
                'parent_id' => $parent->id,
                'type' => 'fee_reminder',
                'title' => 'Fee Payment Reminder',
                'message' => $request->message ?? "Dear parent, fee payment for {$student->name} is due. Please pay promptly.",
                'related_entity_type' => 'fee',
                'related_entity_id' => $student->id,
                'sent_at' => now(),
            ]);
            $sent++;
        }

        return response()->json([
            'message' => "Reminders sent to {$sent} parent(s)",
            'sent_count' => $sent,
        ]);
    }

    // ─── Disbursement / Payroll ────────────────────────────────────
    public function disbursements()
    {
        $schoolId = $this->schoolId();
        $staffCount = User::where('school_id', $schoolId)->whereIn('role', ['teacher', 'academician', 'cashier', 'secretary'])->count();
        return response()->json([
            'total_staff' => $staffCount,
            'estimated_monthly_payroll' => $staffCount * 2500, // demo
            'pending_allowances' => 0,
            'recent_vendor_payments' => [],
        ]);
    }
}
