<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    protected $fillable = [
        'school_id',
        'category',
        'title',
        'description',
        'requester_id',
        'approver_id',
        'approvable_type',
        'approvable_id',
        'status',
        'response_notes',
        'responded_at',
    ];

    const CATEGORIES = ['permission', 'results', 'salary', 'bonus', 'transcript', 'transfer', 'disciplinary', 'other'];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_CANCELLED = 'cancelled';

    public static function statuses(): array
    {
        return [self::STATUS_PENDING, self::STATUS_APPROVED, self::STATUS_REJECTED, self::STATUS_CANCELLED];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function approvable()
    {
        return $this->morphTo();
    }
}
