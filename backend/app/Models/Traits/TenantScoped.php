<?php

namespace App\Models\Traits;

use Illuminate\Support\Facades\Auth;

trait TenantScoped
{
    protected static function bootTenantScoped()
    {
        static::addGlobalScope('school', function ($builder) {
            if (Auth::check()) {
                $user = Auth::user();
                if ($user->isSuperAdmin()) {
                    return;
                }
                $schoolId = $user->school_id;
                if ($schoolId) {
                    $builder->where('school_id', $schoolId);
                }
            }
        });

        static::creating(function ($model) {
            if (Auth::check()) {
                $user = Auth::user();
                if (!$model->school_id && !$user->isSuperAdmin()) {
                    $model->school_id = $user->school_id;
                }
            }
        });
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function scopeWithoutSchool($query)
    {
        return $query->withoutGlobalScope('school');
    }

    public function scopeBySchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
