<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('subscription_plan', 50)->nullable()->after('is_active');
            $table->string('subscription_status', 50)->default('trial')->after('subscription_plan');
            $table->timestamp('subscription_starts_at')->nullable()->after('subscription_status');
            $table->timestamp('subscription_ends_at')->nullable()->after('subscription_starts_at');
            $table->json('config')->nullable()->after('subscription_ends_at');
            $table->string('locale', 10)->default('en')->after('config');
        });
    }

    public function down()
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_plan',
                'subscription_status',
                'subscription_starts_at',
                'subscription_ends_at',
                'config',
                'locale',
            ]);
        });
    }
};
