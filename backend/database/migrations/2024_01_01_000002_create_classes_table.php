<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('section')->nullable();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('capacity')->default(40);
            $table->string('room_number')->nullable();
            $table->smallInteger('is_active')->default(1);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('classes');
    }
};
