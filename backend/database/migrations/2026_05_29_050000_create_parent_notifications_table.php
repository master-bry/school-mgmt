<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('parent_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained();
            $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // result_published, fee_reminder, general
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('related_entity_type')->nullable(); // grade_submission, fee, etc.
            $table->unsignedBigInteger('related_entity_id')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('parent_notifications');
    }
};
