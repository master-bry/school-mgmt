<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class StudentSampleExport implements FromArray, WithHeadings
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        return $this->data;
    }

    public function headings(): array
    {
        return [
            'first_name', 'last_name', 'email', 'class_name', 'grade',
            'phone', 'address', 'date_of_birth', 'password',
            'parent_name', 'parent_email', 'parent_password',
        ];
    }
}
