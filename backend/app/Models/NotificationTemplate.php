<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $fillable = [
        'school_id',
        'key',
        'type',
        'subject',
        'message_en',
        'message_sw',
        'channel',
        'variables',
    ];

    protected $casts = [
        'variables' => 'json',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function scopeBySchool($query, $schoolId)
    {
        return $query->where(function ($q) use ($schoolId) {
            $q->whereNull('school_id')->orWhere('school_id', $schoolId);
        });
    }
}
