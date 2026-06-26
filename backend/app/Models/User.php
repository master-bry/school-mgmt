<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'email',
        'password',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'national_id',
        'religion',
        'nationality',
        'country',
        'city',
        'blood_group',
        'marital_status',
        'employee_code',
        'admission_number',
        'enrollment_date',
        'previous_school',
        'sport_house',
        'transport_route',
        'role',
        'class_id',
        'section_id',
        'grade',
        'parent_id',
        'profile_image',
        'is_active',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_of_birth' => 'date',
        'is_active' => 'boolean',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_PROBATION = 'probation';
    const STATUS_GRADUATED = 'graduated';
    const STATUS_TRANSFERRED = 'transferred';
    const STATUS_WITHDRAWN = 'withdrawn';
    const STATUS_EXPELLED = 'expelled';
    const STATUS_TERMINATED = 'terminated';
    const STATUS_RESIGNED = 'resigned';
    const STATUS_RETIRED = 'retired';
    const STATUS_ON_LEAVE = 'on_leave';

    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE, self::STATUS_INACTIVE, self::STATUS_SUSPENDED,
            self::STATUS_PROBATION, self::STATUS_GRADUATED, self::STATUS_TRANSFERRED,
            self::STATUS_WITHDRAWN, self::STATUS_EXPELLED, self::STATUS_TERMINATED,
            self::STATUS_RESIGNED, self::STATUS_RETIRED, self::STATUS_ON_LEAVE,
        ];
    }

    public static function staffStatuses(): array
    {
        return [self::STATUS_ACTIVE, self::STATUS_INACTIVE, self::STATUS_SUSPENDED, self::STATUS_PROBATION, self::STATUS_TERMINATED, self::STATUS_RESIGNED, self::STATUS_RETIRED, self::STATUS_ON_LEAVE];
    }

    public static function studentStatuses(): array
    {
        return [self::STATUS_ACTIVE, self::STATUS_INACTIVE, self::STATUS_SUSPENDED, self::STATUS_PROBATION, self::STATUS_GRADUATED, self::STATUS_TRANSFERRED, self::STATUS_WITHDRAWN, self::STATUS_EXPELLED, self::STATUS_ON_LEAVE];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function fees()
    {
        return $this->hasMany(Fee::class, 'student_id');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class, 'student_id');
    }

    public function bookLoans()
    {
        return $this->hasMany(BookLoan::class, 'user_id');
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'teacher_id');
    }

    public function taughtClasses()
    {
        return $this->hasMany(ClassModel::class, 'teacher_id');
    }

    public function teacherDetail()
    {
        return $this->hasOne(TeacherDetail::class);
    }

    public function studentDetail()
    {
        return $this->hasOne(StudentDetail::class);
    }

    public function approvals()
    {
        return $this->morphMany(Approval::class, 'approvable');
    }

    public function markedAttendances()
    {
        return $this->hasMany(Attendance::class, 'marked_by');
    }

    public function gradedExams()
    {
        return $this->hasMany(Grade::class, 'graded_by');
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isTeacher()
    {
        return $this->role === 'teacher';
    }

    public function isStudent()
    {
        return $this->role === 'student';
    }

    public function isParent()
    {
        return $this->role === 'parent';
    }

    public function isAcademician()
    {
        return $this->role === 'academician';
    }

    public function isCashier()
    {
        return $this->role === 'cashier';
    }

    public function isHeadOfSchool()
    {
        return $this->role === 'head_of_school';
    }

    public function isAssistantHead()
    {
        return $this->role === 'assistant_head';
    }

    public function isSecretary()
    {
        return $this->role === 'secretary';
    }

    public static function roles(): array
    {
        return [
            'super_admin', 'admin', 'teacher', 'student', 'parent',
            'academician', 'cashier', 'head_of_school', 'assistant_head', 'secretary',
        ];
    }
}
