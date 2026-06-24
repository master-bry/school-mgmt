<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Section;
use App\Models\Exam;
use App\Models\Grade;
use App\Models\Timetable;
use App\Models\Fee;
use App\Models\Attendance;
use App\Models\Blog;
use App\Models\Event;
use App\Models\AcademicResource;
use App\Models\Book;
use App\Models\Announcement;
use App\Models\FeatureFlag;
use App\Models\Assignment;
use App\Models\TeacherRemark;
use App\Models\NotificationTemplate;
use App\Models\StudentDetail;
use App\Models\TeacherDetail;
use App\Models\Approval;
use App\Models\ParentNotification;
use App\Models\Transcript;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'Secret@2026';
        $tzDomain = '@ems.com';

        // ────────────────────────────────────────────────────
        // 1. SUPER ADMIN (SaaS Vendor) - Cross-tenant management
        // ────────────────────────────────────────────────────
        User::create([
            'name' => 'Super Admin',
            'email' => 'super' . $tzDomain,
            'password' => Hash::make($password),
            'role' => 'super_admin',
            'phone' => '+255-712-000001',
            'is_active' => true,
        ]);

        // ────────────────────────────────────────────────────
        // 2. CREATE DEMO SCHOOLS (Tenants)
        // ────────────────────────────────────────────────────
        $schoolsData = [
            [
                'name' => 'Mtakuja Secondary School',
                'email' => 'info@mtakuja.tz',
                'phone' => '+255-712-100001',
                'address' => '123 Mwenge Road, Dar es Salaam',
                'code' => 'MTA001',
                'subscription_plan' => 'growth',
                'subscription_status' => 'active',
                'locale' => 'sw',
            ],
            [
                'name' => 'Golden Valley Academy',
                'email' => 'admin@goldenvalley.tz',
                'phone' => '+255-713-200002',
                'address' => '45 Upanga Street, Dar es Salaam',
                'code' => 'GVA002',
                'subscription_plan' => 'enterprise',
                'subscription_status' => 'active',
                'locale' => 'en',
            ],
            [
                'name' => 'Serengeti International School',
                'email' => 'info@serengeti.tz',
                'phone' => '+255-767-300003',
                'address' => '78 Njiro Road, Arusha',
                'code' => 'SIS003',
                'subscription_plan' => 'starter',
                'subscription_status' => 'trial',
                'locale' => 'en',
            ],
        ];

        foreach ($schoolsData as $sd) {
            School::create(array_merge($sd, [
                'is_active' => true,
                'subscription_starts_at' => now()->subMonths(3),
                'subscription_ends_at' => now()->addMonths(9),
            ]));
        }

        $school = School::where('code', 'MTA001')->first();

        // ────────────────────────────────────────────────────
        // 3. ROLE USERS FOR PRIMARY SCHOOL
        // ────────────────────────────────────────────────────
        $roleData = [
            ['name' => 'System Admin (IT)',     'email' => 'admin',     'role' => 'admin',          'phone' => '+255-712-100101'],
            ['name' => 'John Teacher',           'email' => 'teacher',   'role' => 'teacher',        'phone' => '+255-712-100102'],
            ['name' => 'Jane Student',           'email' => 'student',   'role' => 'student',        'phone' => '+255-712-100103'],
            ['name' => 'Paul Parent',            'email' => 'parent',    'role' => 'parent',         'phone' => '+255-712-100104'],
            ['name' => 'Dr. Sarah Academic',     'email' => 'academician', 'role' => 'academician', 'phone' => '+255-712-100105'],
            ['name' => 'Mike Cashier',           'email' => 'cashier',   'role' => 'cashier',        'phone' => '+255-712-100106'],
            ['name' => 'Principal Adams',        'email' => 'head',      'role' => 'head_of_school', 'phone' => '+255-712-100107'],
            ['name' => 'Vice Principal Brown',   'email' => 'assistant', 'role' => 'assistant_head', 'phone' => '+255-712-100108'],
            ['name' => 'Lucy Secretary',         'email' => 'secretary', 'role' => 'secretary',      'phone' => '+255-712-100109'],
        ];

        $users = [];
        foreach ($roleData as $data) {
            $users[$data['role']] = User::create([
                'school_id' => $school->id,
                'name' => $data['name'],
                'email' => $data['email'] . $tzDomain,
                'password' => Hash::make($password),
                'role' => $data['role'],
                'phone' => $data['phone'],
                'address' => 'Dar es Salaam, Tanzania',
                'is_active' => true,
            ]);
        }

        // Link student to parent
        $users['student']->parent_id = $users['parent']->id;
        $users['student']->save();

        // ────────────────────────────────────────────────────
        // 4. SECTIONS & CLASSES
        // ────────────────────────────────────────────────────
        $section = Section::create([
            'school_id' => $school->id,
            'name' => 'Upper Secondary',
        ]);

        $classNames = [
            'Form 1', 'Form 2', 'Form 3', 'Form 4',
            'Form 5 - Science', 'Form 5 - Arts',
            'Form 6 - Science', 'Form 6 - Arts',
        ];

        $classList = [];
        foreach ($classNames as $i => $name) {
            $classList[$name] = ClassModel::create([
                'school_id' => $school->id,
                'name' => $name,
                'section' => $i < 4 ? 'O-Level' : 'A-Level',
                'teacher_id' => $users['teacher']->id,
                'capacity' => 45,
                'room_number' => 'RM-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'is_active' => true,
            ]);
        }

        // Assign student to Form 1
        $users['student']->class_id = $classList['Form 1']->id;
        $users['student']->save();

        // Create additional students
        $studentNames = [
            'Aisha Mohamed', 'Baraka John', 'Catherine Lema',
            'Daniel Mushi', 'Esther Joseph', 'Frank Mwangi',
            'Grace Ochieng', 'Hamza Ali', 'Imani Zuberi',
            'James Kiprop', 'Khadija Hassan', 'Lawrence Mushi',
        ];

        $extraStudents = [];
        foreach ($studentNames as $name) {
            $s = User::create([
                'school_id' => $school->id,
                'name' => $name,
                'email' => strtolower(str_replace(' ', '.', $name)) . $tzDomain,
                'password' => Hash::make($password),
                'role' => 'student',
                'phone' => '+255-7' . rand(12, 77) . '-' . rand(100000, 999999),
                'class_id' => $classList[array_rand($classList)]->id,
                'parent_id' => $users['parent']->id,
                'is_active' => true,
            ]);
            $extraStudents[] = $s;
        }

        // ────────────────────────────────────────────────────
        // 5. TEACHER DETAILS
        // ────────────────────────────────────────────────────
        TeacherDetail::create([
            'user_id' => $users['teacher']->id,
            'salary' => 1500000,
            'employment_type' => 'full-time',
            'department' => 'Science',
            'qualification' => 'Bachelor of Education',
            'years_experience' => 8,
            'bank_name' => 'CRDB Bank',
            'bank_account' => '015-1234567',
            'bank_code' => 'CRDBTZTZ',
            'tax_id' => 'TIN-123456789',
        ]);

        // ────────────────────────────────────────────────────
        // 6. SUBJECTS (NECTA-aligned)
        // ────────────────────────────────────────────────────
        $subjectNames = [
            'Mathematics', 'English Language', 'Kiswahili',
            'Physics', 'Chemistry', 'Biology',
            'History', 'Geography', 'Civics',
            'ICT', 'Commerce', 'Bookkeeping',
        ];
        $subjects = [];
        foreach ($subjectNames as $i => $name) {
            $subjects[$name] = Subject::create([
                'school_id' => $school->id,
                'name' => $name,
                'code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 3)) . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'description' => "NECTA-aligned {$name} curriculum",
                'teacher_id' => $users['teacher']->id,
                'credits' => 3,
                'is_active' => true,
            ]);
        }

        // ────────────────────────────────────────────────────
        // 7. TIMETABLES (Conflict-free schedule)
        // ────────────────────────────────────────────────────
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        $subjectList = array_values($subjects);
        $subjectCount = count($subjectList);
        $times = [
            ['08:00', '09:00'], ['09:00', '10:00'], ['10:30', '11:30'],
            ['11:30', '12:30'], ['14:00', '15:00'], ['15:00', '16:00'],
        ];

        // Generate for Form 1-4
        foreach (['Form 1', 'Form 2', 'Form 3', 'Form 4'] as $ci => $cn) {
            if (!isset($classList[$cn])) continue;
            $class = $classList[$cn];
            foreach ($days as $di => $day) {
                for ($p = 0; $p < 6; $p++) {
                    $subject = $subjectList[($ci + $di + $p) % $subjectCount];
                    Timetable::create([
                        'school_id' => $school->id,
                        'class_id' => $class->id,
                        'subject_id' => $subject->id,
                        'teacher_id' => $users['teacher']->id,
                        'day' => $day,
                        'start_time' => $times[$p][0],
                        'end_time' => $times[$p][1],
                        'room_number' => 'RM-' . str_pad(101 + $ci * 10 + $p, 3, '0', STR_PAD_LEFT),
                        'academic_year' => '2026',
                        'term' => 'Term 1',
                        'timetable_type' => 'class',
                        'venue' => 'Block ' . chr(65 + $ci),
                    ]);
                }
            }
        }

        // ────────────────────────────────────────────────────
        // 8. EXAMS & GRADES
        // ────────────────────────────────────────────────────
        $examTypes = ['ca', 'midterm', 'terminal'];
        foreach (['Form 1', 'Form 2'] as $cn) {
            if (!isset($classList[$cn])) continue;
            foreach ($subjectList as $subject) {
                foreach ($examTypes as $type) {
                    $exam = Exam::create([
                        'school_id' => $school->id,
                        'name' => ucfirst($type) . " - {$subject->name} ({$cn})",
                        'class_id' => $classList[$cn]->id,
                        'subject_id' => $subject->id,
                        'exam_date' => now()->addDays(rand(-60, 60)),
                        'total_marks' => $type === 'ca' ? 50 : 100,
                        'passing_marks' => $type === 'ca' ? 20 : 40,
                        'exam_type' => $type,
                    ]);

                    // Grade for each student in this class
                    $classStudents = User::where('school_id', $school->id)
                        ->where('role', 'student')
                        ->where('class_id', $classList[$cn]->id)
                        ->get();

                    foreach ($classStudents as $student) {
                        $marks = rand(20, 98);
                        Grade::create([
                            'school_id' => $school->id,
                            'exam_id' => $exam->id,
                            'student_id' => $student->id,
                            'marks_obtained' => $marks,
                            'percentage' => $marks / ($exam->total_marks / 100),
                            'grade' => $marks >= 80 ? 'A' : ($marks >= 65 ? 'B' : ($marks >= 50 ? 'C' : ($marks >= 40 ? 'D' : 'F'))),
                            'graded_by' => $users['teacher']->id,
                            'submission_status' => 'published',
                        ]);
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────
        // 9. FEES (Tanzanian TZS-based)
        // ────────────────────────────────────────────────────
        $feeTypes = [
            ['type' => 'Tuition Fee', 'category' => 'tuition', 'amount' => 450000],
            ['type' => 'Examination Fee', 'category' => 'exam', 'amount' => 85000],
            ['type' => 'Sports & Games', 'category' => 'sports', 'amount' => 35000],
            ['type' => 'Library Fee', 'category' => 'library', 'amount' => 25000],
            ['type' => 'Computer Lab', 'category' => 'lab', 'amount' => 55000],
            ['type' => 'Transport Fee', 'category' => 'transport', 'amount' => 120000],
        ];

        $allStudents = User::where('school_id', $school->id)->where('role', 'student')->get();
        foreach ($allStudents as $student) {
            foreach ($feeTypes as $ft) {
                $statuses = ['paid', 'partial', 'pending', 'overdue'];
                $status = $statuses[array_rand($statuses)];
                $paidAmount = $status === 'paid' ? $ft['amount'] : ($status === 'partial' ? $ft['amount'] * 0.5 : 0);

                Fee::create([
                    'school_id' => $school->id,
                    'student_id' => $student->id,
                    'fee_type' => $ft['type'],
                    'fee_category' => $ft['category'],
                    'type' => 'fee',
                    'amount' => $ft['amount'],
                    'paid_amount' => $paidAmount,
                    'due_date' => now()->addDays(rand(-30, 60)),
                    'paid_date' => $paidAmount > 0 ? now()->subDays(rand(1, 30)) : null,
                    'payment_method' => $paidAmount > 0 ? ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank Transfer'][array_rand(['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank Transfer'])] : null,
                    'status' => $status,
                    'approval_status' => 'approved',
                ]);
            }
        }

        // ────────────────────────────────────────────────────
        // 10. ATTENDANCE RECORDS
        // ────────────────────────────────────────────────────
        foreach ($allStudents as $student) {
            for ($d = 0; $d < 20; $d++) {
                $date = now()->subDays($d);
                if ($date->isSaturday() || $date->isSunday()) continue;
                $statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
                Attendance::create([
                    'school_id' => $school->id,
                    'student_id' => $student->id,
                    'class_id' => $student->class_id,
                    'date' => $date,
                    'status' => $statuses[array_rand($statuses)],
                    'marked_by' => $users['teacher']->id,
                ]);
            }
        }

        // ────────────────────────────────────────────────────
        // 11. ANNOUNCEMENTS
        // ────────────────────────────────────────────────────
        Announcement::create([
            'school_id' => $school->id,
            'title' => 'Tangazo la Mwaka Mpya wa Masomo 2026',
            'content' => 'Karibu sana wanafunzi wote kwa mwaka mpya wa masomo 2026. Tuna matumaini makubwa kwenu.',
            'category' => 'general',
            'is_public' => true,
            'created_by' => $users['academician']->id,
        ]);

        Announcement::create([
            'school_id' => $school->id,
            'title' => 'Mid-Term Examination Schedule',
            'content' => 'The mid-term exams will begin on 15th March 2026. All students must prepare adequately.',
            'category' => 'academic',
            'is_public' => true,
            'created_by' => $users['academician']->id,
        ]);

        // ────────────────────────────────────────────────────
        // 12. BLOG POSTS & EVENTS
        // ────────────────────────────────────────────────────
        Blog::create([
            'school_id' => $school->id,
            'title' => 'Achievements in National Science Fair',
            'content' => 'Our students won 3 gold medals at the Tanzania National Science Fair 2026.',
            'category' => 'achievement',
            'is_published' => true,
            'author_id' => $users['academician']->id,
            'published_at' => now()->subDays(5),
        ]);

        Event::create([
            'school_id' => $school->id,
            'title' => 'Annual Sports Day',
            'description' => 'Inter-house competitions including athletics, football, and netball.',
            'event_date' => now()->addDays(45),
            'type' => 'sports',
            'venue' => 'School Grounds',
            'is_public' => true,
            'created_by' => $users['academician']->id,
        ]);

        Event::create([
            'school_id' => $school->id,
            'title' => 'Parent-Teacher Conference',
            'description' => 'Discuss student progress for Term 1.',
            'event_date' => now()->addDays(30),
            'type' => 'academic',
            'venue' => 'School Hall',
            'is_public' => true,
            'created_by' => $users['academician']->id,
        ]);

        // ────────────────────────────────────────────────────
        // 13. ACADEMIC RESOURCES & BOOKS
        // ────────────────────────────────────────────────────
        AcademicResource::create([
            'school_id' => $school->id,
            'title' => 'Mwongozo wa Hisabati - Form 1 & 2',
            'description' => 'Comprehensive mathematics guide in Kiswahili for O-Level students.',
            'resource_type' => 'document',
            'category' => 'study_material',
            'is_public' => true,
            'uploaded_by' => $users['academician']->id,
        ]);

        AcademicResource::create([
            'school_id' => $school->id,
            'title' => 'NECTA Past Papers - Physics 2020-2025',
            'description' => 'Collection of past NECTA examination papers with marking schemes.',
            'resource_type' => 'pdf',
            'category' => 'past_papers',
            'is_public' => true,
            'uploaded_by' => $users['academician']->id,
        ]);

        Book::create([
            'school_id' => $school->id,
            'title' => 'Advanced Mathematics for Secondary Schools',
            'author' => 'Dr. J. Mwangi',
            'isbn' => '978-9987-123-45-6',
            'description' => 'NECTA-approved mathematics textbook for Forms 5 & 6.',
            'category' => 'textbook',
            'total_copies' => 30,
            'available_copies' => 28,
            'uploaded_by' => $users['academician']->id,
        ]);

        // ────────────────────────────────────────────────────
        // 14. ASSIGNMENTS (Student Assignment Locker)
        // ────────────────────────────────────────────────────
        $assignment = Assignment::create([
            'school_id' => $school->id,
            'class_id' => $classList['Form 1']->id,
            'subject_id' => $subjects['Mathematics']->id,
            'teacher_id' => $users['teacher']->id,
            'title' => 'Algebra - Linear Equations',
            'description' => 'Solve 20 linear equations and submit your work. Show all steps.',
            'due_date' => now()->addDays(7),
            'max_score' => 100,
        ]);

        Assignment::create([
            'school_id' => $school->id,
            'class_id' => $classList['Form 1']->id,
            'subject_id' => $subjects['English Language']->id,
            'teacher_id' => $users['teacher']->id,
            'title' => 'Essay: My Role Model',
            'description' => 'Write a 500-word essay about your role model.',
            'due_date' => now()->addDays(5),
            'max_score' => 50,
        ]);

        // ────────────────────────────────────────────────────
        // 15. TEACHER REMARKS
        // ────────────────────────────────────────────────────
        TeacherRemark::create([
            'school_id' => $school->id,
            'student_id' => $users['student']->id,
            'teacher_id' => $users['teacher']->id,
            'subject_id' => $subjects['Mathematics']->id,
            'category' => 'academic',
            'remark' => 'Jane shows excellent understanding of algebraic concepts. Keep up the good work!',
            'term' => 'Term 1',
        ]);

        TeacherRemark::create([
            'school_id' => $school->id,
            'student_id' => $users['student']->id,
            'teacher_id' => $users['teacher']->id,
            'subject_id' => $subjects['Kiswahili']->id,
            'category' => 'effort',
            'remark' => 'Anaonyesha bidii kubwa katika masomo ya Kiswahili. Endelea hivyo!',
            'term' => 'Term 1',
        ]);

        // ────────────────────────────────────────────────────
        // 16. FEATURE FLAGS
        // ────────────────────────────────────────────────────
        $flags = [
            ['feature_key' => 'necta_grading',    'display_name' => 'NECTA Grading Engine',        'description' => 'NECTA-compliant division/grade calculations'],
            ['feature_key' => 'sms_notifications', 'display_name' => 'SMS Notifications',          'description' => 'Send SMS via local Tanzanian gateways'],
            ['feature_key' => 'swahili_portal',    'display_name' => 'Kiswahili Parent Portal',    'description' => 'Kiswahili language toggle for parent dashboard'],
            ['feature_key' => 'gepg_integration',  'display_name' => 'GePG Payment Integration',   'description' => 'Government e-Payment Gateway for public schools'],
            ['feature_key' => 'assignment_locker', 'display_name' => 'Assignment Locker',          'description' => 'Digital assignment submission system'],
            ['feature_key' => 'report_cards',      'display_name' => 'Report Card Generator',      'description' => 'Automated PDF report card compilation'],
            ['feature_key' => 'conflict_timetable','display_name' => 'Conflict-Free Timetable',    'description' => 'Algorithm-driven timetable scheduling'],
            ['feature_key' => 'audit_trail',       'display_name' => 'Audit Trail Logs',           'description' => 'Full action audit logging for security compliance'],
        ];

        foreach ($flags as $flag) {
            FeatureFlag::create(array_merge($flag, ['is_enabled' => true]));
        }

        // ────────────────────────────────────────────────────
        // 17. SMS NOTIFICATION TEMPLATES (TCRA-compliant)
        // ────────────────────────────────────────────────────
        $smsTemplates = [
            [
                'key' => 'fee_reminder',
                'type' => 'sms',
                'subject' => 'Fee Reminder',
                'message_en' => 'Dear parent, your child {student_name} has an outstanding fee balance of TZS {amount}. Please pay before {due_date} to avoid disruption.',
                'message_sw' => 'Mzazi mpendwa, mtoto wako {student_name} ana deni la shule la TZS {amount}. Tafadhali lipa kabla ya {due_date} ili kuepuka usumbufu.',
                'channel' => 'sms',
                'variables' => json_encode(['student_name', 'amount', 'due_date']),
            ],
            [
                'key' => 'attendance_alert',
                'type' => 'sms',
                'subject' => 'Attendance Alert',
                'message_en' => 'Your child {student_name} was marked absent today ({date}). Please contact the school for more information.',
                'message_sw' => 'Mtoto wako {student_name} hajafika shuleni leo ({date}). Tafadhali wasiliana na shule kwa maelezo zaidi.',
                'channel' => 'sms',
                'variables' => json_encode(['student_name', 'date']),
            ],
            [
                'key' => 'exam_reminder',
                'type' => 'sms',
                'subject' => 'Examination Notice',
                'message_en' => 'Dear parent, {student_name} will sit for {exam_name} on {exam_date}. Ensure they are well prepared.',
                'message_sw' => 'Mzazi mpendwa, {student_name} atafanya mtihani wa {exam_name} tarehe {exam_date}. Hakikisha amejiandaa vizuri.',
                'channel' => 'sms',
                'variables' => json_encode(['student_name', 'exam_name', 'exam_date']),
            ],
            [
                'key' => 'emergency_announcement',
                'type' => 'sms',
                'subject' => 'URGENT: School Announcement',
                'message_en' => 'URGENT: {message}. Please take necessary action. - {school_name}',
                'message_sw' => 'DAWA: {message}. Tafadhali chukua hatua zinazohitajika. - {school_name}',
                'channel' => 'sms',
                'variables' => json_encode(['message', 'school_name']),
            ],
            [
                'key' => 'result_publication',
                'type' => 'sms',
                'subject' => 'Results Published',
                'message_en' => 'Dear parent, results for {exam_name} have been published. Check the parent portal to view {student_name}\'s performance.',
                'message_sw' => 'Mzazi mpendwa, matokeo ya {exam_name} yametangazwa. Angalia portal ya wazazi kuona matokeo ya {student_name}.',
                'channel' => 'sms',
                'variables' => json_encode(['exam_name', 'student_name']),
            ],
        ];

        foreach ($smsTemplates as $template) {
            NotificationTemplate::create(array_merge($template, ['school_id' => $school->id]));
        }

        // ────────────────────────────────────────────────────
        // 18. AUDIT LOG SAMPLES
        // ────────────────────────────────────────────────────
        \App\Models\AuditLog::create([
            'school_id' => $school->id,
            'user_id' => $users['head_of_school']->id,
            'action' => 'user.login',
            'entity_type' => 'User',
            'entity_id' => $users['head_of_school']->id,
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64)',
        ]);

        \App\Models\AuditLog::create([
            'school_id' => $school->id,
            'user_id' => $users['cashier']->id,
            'action' => 'fee.payment_recorded',
            'entity_type' => 'Fee',
            'entity_id' => 1,
            'new_values' => json_encode(['paid_amount' => 450000, 'status' => 'paid']),
            'ip_address' => '192.168.1.101',
        ]);

        \App\Models\AuditLog::create([
            'school_id' => $school->id,
            'user_id' => $users['academician']->id,
            'action' => 'grades.published',
            'entity_type' => 'Grade',
            'entity_id' => 1,
            'new_values' => json_encode(['submission_status' => 'published']),
            'ip_address' => '192.168.1.102',
        ]);

        // ────────────────────────────────────────────────────
        // 19. PARENT NOTIFICATIONS
        // ────────────────────────────────────────────────────
        ParentNotification::create([
            'school_id' => $school->id,
            'parent_id' => $users['parent']->id,
            'type' => 'fee_reminder',
            'title' => 'Ukumbusho wa Malipo',
            'message' => 'Mzazi mpendwa, tafadhali kumbuka kulipa karo ya mtoto wako kabla ya tarehe 15.',
            'sent_at' => now()->subDays(2),
        ]);

        ParentNotification::create([
            'school_id' => $school->id,
            'parent_id' => $users['parent']->id,
            'type' => 'attendance_alert',
            'title' => 'Attendance Alert',
            'message' => 'Your child Jane Student was marked absent on 20th June 2026.',
            'sent_at' => now()->subDays(1),
        ]);

        // ────────────────────────────────────────────────────
        // 20. APPROVALS (For HoS workflow)
        // ────────────────────────────────────────────────────
        Approval::create([
            'school_id' => $school->id,
            'category' => 'salary',
            'title' => 'Salary Approval - John Teacher',
            'description' => 'Pending approval for salary update to TZS 1,500,000',
            'requester_id' => $users['cashier']->id,
            'approvable_type' => 'App\Models\TeacherDetail',
            'approvable_id' => 1,
            'status' => 'pending',
        ]);

        // ────────────────────────────────────────────────────
        // OUTPUT CREDENTIALS
        // ────────────────────────────────────────────────────
        $this->command->info('──────────────────────────────────────────────');
        $this->command->info('  SEED COMPLETE - SYSTEM READY');
        $this->command->info('──────────────────────────────────────────────');
        $this->command->info("  Super Admin:  super{$tzDomain} / {$password}");
        $this->command->info("  Admin:        admin{$tzDomain} / {$password}");
        $this->command->info("  Teacher:      teacher{$tzDomain} / {$password}");
        $this->command->info("  Student:      student{$tzDomain} / {$password}");
        $this->command->info("  Parent:       parent{$tzDomain} / {$password}");
        $this->command->info("  Academician:  academician{$tzDomain} / {$password}");
        $this->command->info("  Cashier:      cashier{$tzDomain} / {$password}");
        $this->command->info("  Head of Sch:  head{$tzDomain} / {$password}");
        $this->command->info("  Asst. Head:   assistant{$tzDomain} / {$password}");
        $this->command->info("  Secretary:    secretary{$tzDomain} / {$password}");
        $this->command->info('──────────────────────────────────────────────');
    }
}
