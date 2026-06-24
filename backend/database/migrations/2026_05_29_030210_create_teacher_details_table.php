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
        Schema::create('teacher_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->unique();
            $table->decimal('salary', 12, 2)->nullable();
            $table->decimal('bonus', 12, 2)->nullable();
            $table->foreignId('salary_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('bonus_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'intern'])->nullable();
            $table->text('qualification')->nullable();
            $table->date('date_joined')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('bank_code')->nullable();
            $table->string('tax_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_details');
    }
};
