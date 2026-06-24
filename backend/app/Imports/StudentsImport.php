<?php

namespace App\Imports;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Section;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsOnError;

class StudentsImport implements ToCollection, WithHeadingRow, SkipsOnError
{
    use Importable;

    protected $schoolId;
    public $imported = [];
    public $errors = [];
    public $parentMap = [];

    public function __construct($schoolId)
    {
        $this->schoolId = $schoolId;
    }

    protected function findOrCreateClass($gradeName)
    {
        $class = ClassModel::where('school_id', $this->schoolId)
            ->where('name', $gradeName)
            ->first();

        if ($class) {
            return $class;
        }

        return ClassModel::create([
            'school_id' => $this->schoolId,
            'name' => $gradeName,
        ]);
    }

    protected function findOrCreateSection(ClassModel $class, $sectionName)
    {
        $section = Section::where('school_id', $this->schoolId)
            ->where('class_id', $class->id)
            ->where('name', $sectionName)
            ->first();

        if ($section) {
            return $section;
        }

        return Section::create([
            'school_id' => $this->schoolId,
            'class_id' => $class->id,
            'name' => $sectionName,
        ]);
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            try {
                $firstName = trim($row['first_name'] ?? '');
                $lastName = trim($row['last_name'] ?? '');
                $email = trim($row['email'] ?? '');
                $className = trim($row['class_name'] ?? '');
                $grade = trim($row['grade'] ?? '');
                $phone = trim($row['phone'] ?? '');
                $address = trim($row['address'] ?? '');
                $dob = trim($row['date_of_birth'] ?? '');
                $password = trim($row['password'] ?? '');
                $parentName = trim($row['parent_name'] ?? '');
                $parentEmail = trim($row['parent_email'] ?? '');
                $parentPassword = trim($row['parent_password'] ?? '');

                if (empty($firstName) || empty($lastName) || empty($email)) {
                    $this->errors[] = ['row' => $row->get('first_name', '') . ' ' . $row->get('last_name', ''), 'error' => 'first_name, last_name, and email are required'];
                    continue;
                }

                if (User::where('email', $email)->exists()) {
                    $this->errors[] = ['row' => $email, 'error' => 'Email already exists'];
                    continue;
                }

                // Find or create the grade-level class
                $class = null;
                $classId = null;
                if (!empty($grade)) {
                    $class = $this->findOrCreateClass($grade);
                    $classId = $class->id;
                }

                // Find or create the section from class_name
                $sectionId = null;
                if (!empty($className) && !empty($class)) {
                    $section = $this->findOrCreateSection($class, $className);
                    $sectionId = $section->id;
                }

                $studentPassword = $password ?: 'Student@123';

                $student = User::create([
                    'school_id' => $this->schoolId,
                    'name' => $firstName . ' ' . $lastName,
                    'email' => $email,
                    'password' => Hash::make($studentPassword),
                    'phone' => $phone ?: null,
                    'address' => $address ?: null,
                    'date_of_birth' => $dob ?: null,
                    'role' => 'student',
                    'class_id' => $classId,
                    'section_id' => $sectionId,
                    'grade' => $grade ?: null,
                ]);

                // Create or find parent
                if (!empty($parentEmail)) {
                    $parent = User::where('email', $parentEmail)->where('role', 'parent')->first();
                    if (!$parent) {
                        $parent = User::create([
                            'school_id' => $this->schoolId,
                            'name' => $parentName ?: 'Parent of ' . $student->name,
                            'email' => $parentEmail,
                            'password' => Hash::make($parentPassword ?: 'parent123'),
                            'phone' => null,
                            'role' => 'parent',
                        ]);
                        $this->parentMap[$parentEmail] = [
                            'email' => $parentEmail,
                            'password' => $parentPassword ?: 'parent123',
                        ];
                    } else {
                        $this->parentMap[$parentEmail] = [
                            'email' => $parentEmail,
                            'password' => 'Already existed',
                        ];
                    }
                    $student->parent_id = $parent->id;
                    $student->save();
                }

                $this->imported[] = [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'password' => $studentPassword,
                ];
            } catch (\Exception $e) {
                $this->errors[] = ['row' => $row->get('email', 'unknown'), 'error' => $e->getMessage()];
            }
        }
    }

    public function onError(\Throwable $e)
    {
        $this->errors[] = ['row' => 'unknown', 'error' => $e->getMessage()];
    }
}
