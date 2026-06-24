<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentDetail extends Model
{
    protected $fillable = [
        'user_id',
        'guardian_name',
        'guardian_phone',
        'guardian_email',
        'guardian_relationship',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'medical_info',
        'allergies',
        'discipline_records',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
