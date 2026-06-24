<?php

namespace App\Models;

use App\Models\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id', 'student_id', 'type', 'fee_type', 'amount', 'paid_amount',
        'due_date', 'paid_date', 'status', 'payment_method', 'transaction_id', 'remarks',
        'approval_status', 'reviewed_by_ah', 'reviewed_at_ah', 'ah_notes',
        'approved_by_hos', 'approved_at_hos', 'hos_notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_date' => 'date',
        'reviewed_at_ah' => 'datetime',
        'approved_at_hos' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function reviewedByAh()
    {
        return $this->belongsTo(User::class, 'reviewed_by_ah');
    }

    public function approvedByHos()
    {
        return $this->belongsTo(User::class, 'approved_by_hos');
    }

    public function getRemainingAmountAttribute()
    {
        return $this->amount - $this->paid_amount;
    }
}
