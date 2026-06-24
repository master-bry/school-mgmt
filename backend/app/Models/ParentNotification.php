<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\TenantScoped;

class ParentNotification extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id', 'parent_id', 'type', 'title', 'message',
        'related_entity_type', 'related_entity_id', 'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
