<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\TenantScoped;

class TeacherRemark extends Model
{
    use TenantScoped;

    protected $fillable = [
        'school_id',
        'student_id',
        'teacher_id',
        'subject_id',
        'category',
        'remark',
        'term',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
