<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('religion')->nullable()->after('national_id');
            $table->string('nationality')->nullable()->after('religion');
            $table->string('blood_group')->nullable()->after('nationality');
            $table->string('admission_number')->nullable()->after('employee_code');
            $table->date('enrollment_date')->nullable()->after('admission_number');
            $table->string('previous_school')->nullable()->after('enrollment_date');
            $table->string('sport_house')->nullable()->after('previous_school');
            $table->string('transport_route')->nullable()->after('sport_house');
        });

        Schema::create('student_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_phone')->nullable();
            $table->string('guardian_email')->nullable();
            $table->string('guardian_relationship')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();
            $table->text('medical_info')->nullable();
            $table->text('allergies')->nullable();
            $table->text('discipline_records')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('category'); // permission, results, salary, bonus, transcript, transfer, disciplinary, other
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->morphs('approvable');
            $table->string('status')->default('pending'); // pending, approved, rejected, cancelled
            $table->text('response_notes')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
        Schema::dropIfExists('student_details');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['religion', 'nationality', 'blood_group', 'admission_number', 'enrollment_date', 'previous_school', 'sport_house', 'transport_route']);
        });
    }
};
