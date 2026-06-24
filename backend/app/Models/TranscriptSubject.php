<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TranscriptSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'transcript_id',
        'subject_id',
        'exam_id',
        'marks_obtained',
        'total_marks',
        'percentage',
        'grade',
    ];

    protected $casts = [
        'marks_obtained' => 'decimal:2',
        'total_marks' => 'decimal:2',
        'percentage' => 'decimal:2',
    ];

    public function transcript()
    {
        return $this->belongsTo(Transcript::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}
