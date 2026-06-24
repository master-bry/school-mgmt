<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StudentTemplateSheet implements FromArray, WithHeadings, WithTitle, WithStyles
{
    protected $classId;
    protected $classes;

    public function __construct($classId = null, $classes = [])
    {
        $this->classId = $classId;
        $this->classes = $classes;
    }

    public function array(): array
    {
        return [
            ['Jane', 'Doe', 'jane.doe@student.ems.com', 'Grade 10A', 'Grade 10', '+255712345678', 'Mikocheni, Dar es Salaam', '2009-03-15', 'Student@123', 'John Doe', 'johndoe@gmail.com', 'parent123'],
        ];
    }

    public function headings(): array
    {
        return [
            'first_name',
            'last_name',
            'email',
            'class_name',
            'grade',
            'phone',
            'address',
            'date_of_birth',
            'password',
            'parent_name',
            'parent_email',
            'parent_password',
        ];
    }

    public function title(): string
    {
        return 'Students';
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:L1')->getFont()->setBold(true);
        $sheet->getStyle('A1:L1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE2E8F0');

        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->getStyle('A2:L2')->getFont()->setItalic(true)->getColor()->setARGB('FF94A3B8');

        return [];
    }
}
