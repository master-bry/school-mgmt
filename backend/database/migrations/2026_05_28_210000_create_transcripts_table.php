<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('transcripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->string('term')->nullable();
            $table->string('academic_year')->nullable();
            $table->decimal('total_marks', 10, 2)->default(0);
            $table->decimal('obtained_marks', 10, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->string('grade', 10)->nullable();
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'published'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('head_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('head_approved_at')->nullable();
            $table->text('head_notes')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('transcript_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transcript_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('exam_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('marks_obtained', 8, 2)->default(0);
            $table->decimal('total_marks', 8, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->string('grade', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transcript_subjects');
        Schema::dropIfExists('transcripts');
    }
};
