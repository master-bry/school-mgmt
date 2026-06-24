<?php

namespace App\Models;

use App\Models\Traits\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookLoan extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'school_id',
        'book_id',
        'user_id',
        'issue_date',
        'due_date',
        'return_date',
        'status',
        'fine_amount',
        'remarks',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
        'fine_amount' => 'decimal:2',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isOverdue()
    {
        return $this->status === 'issued' && $this->due_date < now();
    }
}
