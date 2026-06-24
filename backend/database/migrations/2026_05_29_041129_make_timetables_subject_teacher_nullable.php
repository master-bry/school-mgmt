<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['teacher_id']);
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->foreignId('subject_id')->nullable()->change();
            $table->foreignId('teacher_id')->nullable()->change();
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['teacher_id']);
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->foreignId('subject_id')->nullable(false)->change();
            $table->foreignId('teacher_id')->nullable(false)->change();
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
