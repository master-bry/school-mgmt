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
        Schema::table('users', function (Blueprint $table) {
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('national_id')->nullable()->after('gender');
            $table->string('marital_status')->nullable()->after('national_id');
            $table->string('employee_code')->nullable()->after('marital_status');
        });

        Schema::table('teacher_details', function (Blueprint $table) {
            $table->string('department')->nullable()->after('employment_type');
            $table->integer('years_experience')->nullable()->after('qualification');
            $table->string('previous_employer')->nullable()->after('years_experience');
            $table->string('emergency_relationship')->nullable()->after('emergency_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['gender', 'national_id', 'marital_status', 'employee_code']);
        });

        Schema::table('teacher_details', function (Blueprint $table) {
            $table->dropColumn(['department', 'years_experience', 'previous_employer', 'emergency_relationship']);
        });
    }
};
