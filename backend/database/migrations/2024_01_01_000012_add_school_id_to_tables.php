<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('fees', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('grades', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('timetables', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('books', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
        Schema::table('book_loans', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->onDelete('cascade')->after('id');
        });
    }

    public function down()
    {
        Schema::table('classes', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('subjects', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('attendances', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('fees', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('exams', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('grades', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('timetables', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('books', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
        Schema::table('book_loans', fn(Blueprint $t) => $t->dropConstrainedForeignId('school_id'));
    }
};
