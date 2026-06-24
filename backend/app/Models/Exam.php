<?php

namespace App\Models;

use App\Models\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id',
        'name',
        'class_id',
        'subject_id',
        'exam_date',
        'total_marks',
        'passing_marks',
        'exam_type',
    ];

    protected $casts = [
        'exam_date' => 'date',
        'total_marks' => 'decimal:2',
        'passing_marks' => 'decimal:2',
    ];

    public function class()
    {
        return $this->belongsTo(ClassModel::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}
