<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('fees', function (Blueprint $table) {
            if (!Schema::hasColumn('fees', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('teacher_details', function (Blueprint $table) {
            if (!Schema::hasColumn('teacher_details', 'salary_approved_at')) {
                $table->timestamp('salary_approved_at')->nullable();
            }
            if (!Schema::hasColumn('teacher_details', 'bonus_approved_at')) {
                $table->timestamp('bonus_approved_at')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });

        Schema::table('teacher_details', function (Blueprint $table) {
            $table->dropColumn('salary_approved_at');
            $table->dropColumn('bonus_approved_at');
        });
    }
};
