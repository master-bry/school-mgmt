<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('permission_reason')->nullable()->after('remarks');
            $table->integer('permission_days')->nullable()->after('permission_reason');
            $table->string('permission_status')->nullable()->after('permission_days');
            $table->foreignId('permission_approved_by')->nullable()->after('permission_status')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('permission_approved_at')->nullable()->after('permission_approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['permission_reason', 'permission_days', 'permission_status', 'permission_approved_by', 'permission_approved_at']);
        });
    }
};
