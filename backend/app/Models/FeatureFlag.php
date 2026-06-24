<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'feature_key',
        'display_name',
        'description',
        'is_enabled',
        'school_id',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function scopeGlobal($query)
    {
        return $query->whereNull('school_id');
    }

    public function scopeBySchool($query, $schoolId)
    {
        return $query->where(function ($q) use ($schoolId) {
            $q->whereNull('school_id')->orWhere('school_id', $schoolId);
        });
    }
}
