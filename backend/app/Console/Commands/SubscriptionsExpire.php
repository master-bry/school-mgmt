<?php

namespace App\Console\Commands;

use App\Models\School;
use Illuminate\Console\Command;

class SubscriptionsExpire extends Command
{
    protected $signature = 'subscriptions:expire';
    protected $description = 'Expire subscriptions that are past their end date';

    public function handle()
    {
        School::where('subscription_status', 'active')
            ->where('subscription_ends_at', '<=', now())
            ->get()->each(function ($school) {
                $school->update(['subscription_status' => 'expired']);
                $school->syncUserStatus();
            });

        $this->info('Expired subscriptions and deactivated users.');

        School::where('subscription_status', 'trial')
            ->where('subscription_ends_at', '<=', now())
            ->get()->each(function ($school) {
                $school->update(['subscription_status' => 'expired']);
                $school->syncUserStatus();
            });

        $this->info('Expired trials and deactivated users.');

        return Command::SUCCESS;
    }
}
