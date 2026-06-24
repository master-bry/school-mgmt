<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('feature_key', 100)->unique();
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->smallInteger('is_enabled')->default(0);
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('feature_flags');
    }
};
