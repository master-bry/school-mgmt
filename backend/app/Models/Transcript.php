<?php

namespace App\Models;

use App\Models\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transcript extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id',
        'student_id',
        'class_id',
        'term',
        'academic_year',
        'total_marks',
        'obtained_marks',
        'percentage',
        'grade',
        'status',
        'created_by',
        'submitted_at',
        'head_approved_by',
        'head_approved_at',
        'head_notes',
        'published_at',
    ];

    protected $casts = [
        'total_marks' => 'decimal:2',
        'obtained_marks' => 'decimal:2',
        'percentage' => 'decimal:2',
        'submitted_at' => 'datetime',
        'head_approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function headApprovedBy()
    {
        return $this->belongsTo(User::class, 'head_approved_by');
    }

    public function subjects()
    {
        return $this->hasMany(TranscriptSubject::class);
    }
}
