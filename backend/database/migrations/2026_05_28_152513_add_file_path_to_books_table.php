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
        Schema::table('books', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('description');
            $table->string('file_type')->nullable()->after('file_path');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->after('file_type');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->dropColumn(['file_path', 'file_type', 'uploaded_by']);
        });
    }
};
