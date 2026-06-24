<?php

namespace App\Models\Traits;

use App\Models\User;
use Illuminate\Support\Facades\DB;

trait ParentEnrichment
{
    protected function enrichedParents($schoolId)
    {
        $parents = User::where('role', 'parent')
            ->where('school_id', $schoolId)
            ->withCount(['children as children_count'])
            ->orderBy('name')
            ->get();

        $parentIds = $parents->pluck('id');
        $children = User::whereIn('parent_id', $parentIds)
            ->where('role', 'student')
            ->with('class', 'section')
            ->get()
            ->groupBy('parent_id');

        $feeSummaries = DB::table('fees')
            ->whereIn('student_id', User::whereIn('parent_id', $parentIds)->where('role', 'student')->pluck('id'))
            ->selectRaw("
                student_id,
                COUNT(*) as total_fees,
                SUM(amount) as total_amount,
                SUM(paid_amount) as total_paid,
                SUM(CASE WHEN status IN ('pending','overdue') THEN amount - paid_amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count
            ")
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $notifications = \App\Models\ParentNotification::whereIn('parent_id', $parentIds)
            ->whereIn('type', ['result_published', 'fee_reminder'])
            ->get()
            ->groupBy('parent_id');

        return $parents->map(function ($parent) use ($children, $feeSummaries, $notifications) {
            $parentChildren = $children->get($parent->id, collect());
            $parentNotifications = $notifications->get($parent->id, collect());

            return [
                'id' => $parent->id,
                'name' => $parent->name,
                'email' => $parent->email,
                'phone' => $parent->phone,
                'children_count' => (int) $parent->children_count,
                'created_at' => $parent->created_at,
                'children' => $parentChildren->map(function ($child) use ($feeSummaries) {
                    $fee = $feeSummaries->get($child->id);
                    return [
                        'id' => $child->id,
                        'name' => $child->name,
                        'email' => $child->email,
                        'grade' => $child->class?->name,
                        'section' => $child->section?->name,
                        'status' => $child->is_active ? 'active' : ($child->suspended_at ? 'suspended' : 'inactive'),
                        'fees' => $fee ? [
                            'total_fees' => (float) $fee->total_amount,
                            'total_paid' => (float) $fee->total_paid,
                            'pending' => (float) max(0, $fee->pending_amount),
                            'overdue_fees' => (int) $fee->overdue_count,
                        ] : [
                            'total_fees' => 0,
                            'total_paid' => 0,
                            'pending' => 0,
                            'overdue_fees' => 0,
                        ],
                    ];
                }),
                'notifications' => [
                    'results_sent' => $parentNotifications->where('type', 'result_published')->count(),
                    'reminders_sent' => $parentNotifications->where('type', 'fee_reminder')->count(),
                ],
            ];
        });
    }
}
