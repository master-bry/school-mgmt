<?php

namespace App\Models;

use App\Models\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id',
        'title',
        'author',
        'isbn',
        'publisher',
        'publication_year',
        'category',
        'total_copies',
        'available_copies',
        'location',
        'description',
    ];

    protected $casts = [
        'publication_year' => 'integer',
    ];

    public function loans()
    {
        return $this->hasMany(BookLoan::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isAvailable()
    {
        return $this->available_copies > 0;
    }
}
