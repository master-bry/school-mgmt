<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherDetail extends Model
{
    protected $fillable = [
        'user_id',
        'salary',
        'bonus',
        'salary_approved_by',
        'bonus_approved_by',
        'employment_type',
        'department',
        'qualification',
        'years_experience',
        'previous_employer',
        'date_joined',
        'emergency_contact',
        'emergency_phone',
        'emergency_relationship',
        'bank_name',
        'bank_account',
        'bank_code',
        'tax_id',
        'notes',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'bonus' => 'decimal:2',
        'date_joined' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function salaryApprovedBy()
    {
        return $this->belongsTo(User::class, 'salary_approved_by');
    }

    public function bonusApprovedBy()
    {
        return $this->belongsTo(User::class, 'bonus_approved_by');
    }
}