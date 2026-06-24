<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->string('applies_to')->default('student')->after('student_id');
            $table->string('grade')->nullable()->after('applies_to');
            $table->string('fee_category')->nullable()->after('fee_type');
        });
    }

    public function down(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['applies_to', 'grade', 'fee_category']);
        });
    }
};
