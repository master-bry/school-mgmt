<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'logo',
        'code',
        'is_active',
        'subscription_plan',
        'subscription_status',
        'subscription_starts_at',
        'subscription_ends_at',
        'config',
        'locale',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'subscription_starts_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'config' => 'json',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function classes()
    {
        return $this->hasMany(ClassModel::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class);
    }

    public function fees()
    {
        return $this->hasMany(Fee::class);
    }

    public function featureFlags()
    {
        return $this->hasMany(FeatureFlag::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notificationTemplates()
    {
        return $this->hasMany(NotificationTemplate::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function teacherRemarks()
    {
        return $this->hasMany(TeacherRemark::class);
    }

    public function isSubscriptionActive(): bool
    {
        return $this->is_active
            && $this->subscription_status === 'active'
            && $this->subscription_ends_at
            && $this->subscription_ends_at->isFuture();
    }

    public function isOnTrial(): bool
    {
        return $this->subscription_status === 'trial';
    }

    public function isAccessible(): bool
    {
        return $this->is_active && in_array($this->subscription_status, ['active', 'trial']);
    }

    public function syncUserStatus(): void
    {
        $active = $this->isAccessible();
        $this->users()->update(['is_active' => $active]);
    }

    public function featureEnabled(string $key): bool
    {
        $config = $this->config ?? [];
        $features = $config['features'] ?? [];

        if (array_key_exists($key, $features)) {
            return (bool) $features[$key];
        }

        $global = FeatureFlag::whereNull('school_id')->where('feature_key', $key)->first();
        return $global ? $global->is_enabled : false;
    }
}
