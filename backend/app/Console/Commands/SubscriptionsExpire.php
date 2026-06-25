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
        $expired = School::where('subscription_status', 'active')
            ->where('subscription_ends_at', '<=', now())
            ->update(['subscription_status' => 'expired']);

        $this->info("Expired {$expired} subscription(s).");

        $trialsEnded = School::where('subscription_status', 'trial')
            ->where('subscription_ends_at', '<=', now())
            ->update(['subscription_status' => 'expired']);

        $this->info("Expired {$trialsEnded} trial(s).");

        return Command::SUCCESS;
    }
}
