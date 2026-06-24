<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('status');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->index('school_id');
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('day');
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->index('school_id');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->index('school_id');
        });

        Schema::table('student_details', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('teacher_details', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['day']);
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
        });

        Schema::table('student_details', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('teacher_details', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
