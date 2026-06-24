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
        Schema::table('timetables', function (Blueprint $table) {
            $table->string('academic_year')->nullable()->after('room_number');
            $table->string('term')->nullable()->after('academic_year');
            $table->string('timetable_type')->default('class')->after('term');
            $table->string('venue')->nullable()->after('timetable_type');
        });
    }

    public function down(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            $table->dropColumn(['academic_year', 'term', 'timetable_type', 'venue']);
        });
    }
};
