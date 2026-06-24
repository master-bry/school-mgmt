<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\Section;

class GenerateStudentSample extends Command
{
    protected $signature = 'generate:student-sample {--count=50}';
    protected $description = 'Generate sample student Excel data with correct domains';
    protected $schoolId;

    public function handle()
    {
        $this->schoolId = 1;
        $count = (int) $this->option('count');

        $faker = \Faker\Factory::create();
        $grades = ['Grade 10', 'Grade 11', 'Grade 12'];
        $sectionsByGrade = [
            'Grade 10' => ['Grade 10A', 'Grade 10B'],
            'Grade 11' => ['Grade 11A', 'Grade 11B'],
            'Grade 12' => ['Grade 12A', 'Grade 12B'],
        ];

        $parentPool = [];
        for ($i = 1; $i <= 10; $i++) {
            $parentPool[] = [
                'name' => $faker->name(),
                'email' => 'parent' . $i . '@gmail.com',
                'password' => 'Parent@123',
            ];
        }

        $rows = [];
        $studentIndex = 1;
        for ($i = 0; $i < $count; $i++) {
            $grade = $grades[array_rand($grades)];
            $sectionName = $sectionsByGrade[$grade][array_rand($sectionsByGrade[$grade])];
            $parent = $parentPool[array_rand($parentPool)];

            $firstName = $faker->firstName();
            $lastName = $faker->lastName();
            $email = strtolower($firstName . '.' . $lastName . $studentIndex . '@student.ems.com');
            $studentIndex++;

            $rows[] = [
                $firstName,
                $lastName,
                $email,
                $sectionName,
                $grade,
                '+255' . $faker->numerify('#########'),
                $faker->streetAddress() . ', Dar es Salaam',
                $faker->date('Y-m-d', '-10 years'),
                'Student@123',
                $parent['name'],
                $parent['email'],
                $parent['password'],
            ];
        }

        $path = storage_path('app/students_sample.xlsx');
        \Maatwebsite\Excel\Facades\Excel::store(new \App\Exports\StudentSampleExport($rows), 'students_sample.xlsx');
        $this->info("Generated {$count} sample rows to: {$path}");

        // Also copy to project root
        $rootPath = dirname(base_path()) . '/students_sample_50_tz.xlsx';
        copy($path, $rootPath);
        $this->info("Copied to project root as: {$rootPath}");
    }
}
