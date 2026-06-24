<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('role');
            $table->index(['school_id', 'role']);
            $table->index(['school_id', 'is_active']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->index('student_id');
            $table->index('date');
            $table->index('status');
            $table->index(['student_id', 'date']);
            $table->index(['student_id', 'status']);
            $table->index(['class_id', 'date']);
        });

        Schema::table('fees', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('student_id');
            $table->index('status');
            $table->index('approval_status');
            $table->index(['school_id', 'status']);
            $table->index(['school_id', 'approval_status']);
            $table->index(['student_id', 'status']);
            $table->index(['student_id', 'due_date']);
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('category');
            $table->index('status');
            $table->index(['school_id', 'category', 'status']);
            $table->index('requester_id');
            $table->index('approvable_type');
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->index('student_id');
            $table->index('exam_id');
            $table->index(['student_id', 'exam_id']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('teacher_id');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->index('class_id');
            $table->index('subject_id');
            $table->index(['class_id', 'subject_id']);
        });

        Schema::table('grade_submissions', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('status');
            $table->index(['school_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['role']);
            $table->dropIndex(['school_id', 'role']);
            $table->dropIndex(['school_id', 'is_active']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['student_id']);
            $table->dropIndex(['date']);
            $table->dropIndex(['status']);
            $table->dropIndex(['student_id', 'date']);
            $table->dropIndex(['student_id', 'status']);
            $table->dropIndex(['class_id', 'date']);
        });

        Schema::table('fees', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['student_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['approval_status']);
            $table->dropIndex(['school_id', 'status']);
            $table->dropIndex(['school_id', 'approval_status']);
            $table->dropIndex(['student_id', 'status']);
            $table->dropIndex(['student_id', 'due_date']);
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['category']);
            $table->dropIndex(['status']);
            $table->dropIndex(['school_id', 'category', 'status']);
            $table->dropIndex(['requester_id']);
            $table->dropIndex(['approvable_type']);
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex(['student_id']);
            $table->dropIndex(['exam_id']);
            $table->dropIndex(['student_id', 'exam_id']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['teacher_id']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex(['class_id']);
            $table->dropIndex(['subject_id']);
            $table->dropIndex(['class_id', 'subject_id']);
        });

        Schema::table('grade_submissions', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['school_id', 'status']);
        });
    }
};
