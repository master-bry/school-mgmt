<?php

namespace App\Models;

use App\Models\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicResource extends Model
{
    
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id', 'title', 'description', 'file_path',
        'resource_type', 'category', 'is_public', 'uploaded_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
