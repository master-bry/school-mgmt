<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->string('approval_status')->default('pending_cashier')->after('status');
            $table->foreignId('reviewed_by_ah')->nullable()->constrained('users')->after('approval_status');
            $table->timestamp('reviewed_at_ah')->nullable()->after('reviewed_by_ah');
            $table->text('ah_notes')->nullable()->after('reviewed_at_ah');
            $table->foreignId('approved_by_hos')->nullable()->constrained('users')->after('ah_notes');
            $table->timestamp('approved_at_hos')->nullable()->after('approved_by_hos');
            $table->text('hos_notes')->nullable()->after('approved_at_hos');
        });
    }

    public function down()
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn([
                'approval_status', 'reviewed_by_ah', 'reviewed_at_ah', 'ah_notes',
                'approved_by_hos', 'approved_at_hos', 'hos_notes',
            ]);
        });
    }
};
