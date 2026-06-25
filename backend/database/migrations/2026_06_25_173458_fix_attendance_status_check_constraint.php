<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_status_check');
        DB::statement("ALTER TABLE attendances ADD CONSTRAINT attendances_status_check CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'excused'::character varying, 'permission'::character varying]::text[]))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_status_check');
        DB::statement("ALTER TABLE attendances ADD CONSTRAINT attendances_status_check CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'excused'::character varying]::text[]))");
    }
};
