<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('type', 50)->default('sms');
            $table->string('subject')->nullable();
            $table->text('message_en');
            $table->text('message_sw')->nullable();
            $table->string('channel', 50)->default('sms');
            $table->json('variables')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'key']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('notification_templates');
    }
};
