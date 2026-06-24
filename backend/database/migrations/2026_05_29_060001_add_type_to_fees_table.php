<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->string('type')->default('fee')->after('fee_type');
        });
    }

    public function down()
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
