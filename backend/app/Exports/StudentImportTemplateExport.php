<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class StudentImportTemplateExport implements WithMultipleSheets
{
    protected $classId;
    protected $classes;

    public function __construct($classId = null, $classes = [])
    {
        $this->classId = $classId;
        $this->classes = $classes;
    }

    public function sheets(): array
    {
        return [
            new StudentTemplateSheet($this->classId, $this->classes),
        ];
    }
}
