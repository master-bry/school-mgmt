<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\FeeController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\TimetableController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AcademicianController;
use App\Http\Controllers\CashierController;
use App\Http\Controllers\HeadOfSchoolController;
use App\Http\Controllers\AssistantHeadController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\SecretaryController;

// Public routes
Route::get('/announcements/public', [AnnouncementController::class, 'publicIndex']);
Route::get('/schools', [AuthController::class, 'schools']);

// Auth routes
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
Route::post('/login', [AuthController::class, 'login'])->name('login')->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);

    // Announcements (admin, teacher, secretary)
    Route::apiResource('announcements', AnnouncementController::class);

    // ────── Admin (IT) Routes ──────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::apiResource('users', AdminController::class)->except(['create', 'edit']);
        Route::apiResource('classes', ClassController::class)->except(['create', 'edit']);
        Route::apiResource('subjects', SubjectController::class)->except(['create', 'edit']);
        Route::get('/rbac-matrix', [AdminController::class, 'rbacMatrix']);
        Route::get('/audit-trail', [AdminController::class, 'auditTrail']);
        Route::get('/parents', [AdminController::class, 'getParents']);
    });

    // ────── Teacher Routes ──────
    Route::middleware('role:teacher')->prefix('teacher')->group(function () {
        Route::get('/dashboard', [TeacherController::class, 'dashboard']);
        Route::get('/classes', [TeacherController::class, 'assignedClasses']);
        Route::get('/resources', [TeacherController::class, 'resources']);
        Route::get('/books', [TeacherController::class, 'books']);
        Route::post('/attendance', [AttendanceController::class, 'store']);
        Route::get('/attendance/{class_id}', [AttendanceController::class, 'show']);
        Route::post('/grades', [ExamController::class, 'storeGrades']);
        Route::post('/grades/submit', [ExamController::class, 'submitGrades']);
    });

    // ────── Student Routes ──────
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/dashboard', [StudentController::class, 'dashboard']);
        Route::get('/timetables', [StudentController::class, 'timetables']);
        Route::get('/timetable', [TimetableController::class, 'studentTimetable']);
        Route::get('/grades', [ExamController::class, 'studentGrades']);
        Route::get('/attendance', [AttendanceController::class, 'studentAttendance']);
        Route::get('/blogs', [StudentController::class, 'blogs']);
        Route::get('/events', [StudentController::class, 'events']);
        Route::get('/resources', [StudentController::class, 'resources']);
        Route::get('/books', [StudentController::class, 'books']);
        Route::get('/fees', [FeeController::class, 'studentFees']);
    });

    // ────── Parent Routes ──────
    Route::middleware('role:parent')->prefix('parent')->group(function () {
        Route::get('/dashboard', [ParentController::class, 'dashboard']);
        Route::get('/child/{id}/attendance', [ParentController::class, 'childAttendance']);
        Route::get('/child/{id}/grades', [ParentController::class, 'childGrades']);
        Route::get('/child/{id}/fees', [FeeController::class, 'childFees']);
    });

    // ────── Academician Routes ──────
    Route::middleware('role:academician')->prefix('academician')->group(function () {
        Route::get('/dashboard', [AcademicianController::class, 'dashboard']);
        Route::get('/parents', [AcademicianController::class, 'getParents']);
        // Books / materials - Full CRUD
        Route::get('/books', [AcademicianController::class, 'books']);
        Route::get('/books/{id}', [AcademicianController::class, 'showBook']);
        Route::post('/books', [AcademicianController::class, 'storeBook']);
        Route::put('/books/{id}', [AcademicianController::class, 'updateBook']);
        Route::delete('/books/{id}', [AcademicianController::class, 'destroyBook']);
        // Classes - Full CRUD
        Route::get('/classes', [AcademicianController::class, 'getClasses']);
        Route::get('/classes/{id}', [AcademicianController::class, 'getClasses']);
        Route::post('/classes', [AcademicianController::class, 'storeClass']);
        Route::put('/classes/{id}', [AcademicianController::class, 'updateClass']);
        Route::delete('/classes/{id}', [AcademicianController::class, 'destroyClass']);
        // Class subject assignment
        Route::post('/classes/assign-subjects', [AcademicianController::class, 'assignSubjectsToClass']);
        Route::get('/classes/{id}/subjects', [AcademicianController::class, 'getClassSubjects']);
        // Subjects
        Route::get('/subjects', [AcademicianController::class, 'getSubjects']);
        // Grades (classes as grades)
        Route::get('/grades', [AcademicianController::class, 'getGrades']);
        // Timetables
        Route::get('/timetables', [AcademicianController::class, 'timetables']);
        Route::get('/timetables/class/{id}', [AcademicianController::class, 'getClassTimetable']);
        Route::post('/timetables', [AcademicianController::class, 'storeTimetable']);
        Route::post('/timetables/generate', [AcademicianController::class, 'generateGradeTimetables']);
        Route::put('/timetables/{id}', [AcademicianController::class, 'updateTimetable']);
        Route::delete('/timetables/{id}', [AcademicianController::class, 'destroyTimetable']);
        // Teacher / session assignment
        Route::get('/teachers', [AcademicianController::class, 'getTeachers']);
        Route::get('/assigned-teachers', [AcademicianController::class, 'assignedTeachers']);
        Route::post('/assign-teacher-subject', [AcademicianController::class, 'assignTeacherToSubject']);
        Route::post('/assign-teacher-class', [AcademicianController::class, 'assignTeacherToClass']);
        // Exam result review workflow
        Route::get('/submissions/pending', [AcademicianController::class, 'pendingSubmissions']);
        Route::put('/submissions/{id}/review', [AcademicianController::class, 'reviewSubmission']);
        Route::post('/submissions/{id}/forward', [AcademicianController::class, 'forwardToHead']);
        Route::post('/submissions/{id}/publish', [AcademicianController::class, 'publishResults']);
        // Combined results
        Route::get('/results/combined', [AcademicianController::class, 'combinedResults']);
        // Students - view only (for transcripts/grades)
        Route::get('/students', [AcademicianController::class, 'students']);
        Route::get('/students/{id}/grades', [AcademicianController::class, 'studentGrades']);
        // Academic transcripts
        Route::post('/transcripts/generate', [AcademicianController::class, 'generateTranscript']);
        Route::post('/transcripts/generate-bulk', [AcademicianController::class, 'generateBulkTranscripts']);
        Route::get('/transcripts', [AcademicianController::class, 'transcripts']);
        Route::get('/transcripts/{id}', [AcademicianController::class, 'showTranscript']);
        Route::delete('/transcripts/{id}', [AcademicianController::class, 'deleteTranscript']);
        Route::post('/transcripts/{id}/submit', [AcademicianController::class, 'submitTranscript']);
        Route::post('/transcripts/{id}/publish', [AcademicianController::class, 'publishTranscript']);
        Route::get('/transcripts/{id}/print', [AcademicianController::class, 'printTranscript']);
        // Blog / Notes management
        Route::get('/blogs', [AcademicianController::class, 'blogs']);
        Route::post('/blogs', [AcademicianController::class, 'storeBlog']);
        Route::put('/blogs/{id}', [AcademicianController::class, 'updateBlog']);
        Route::delete('/blogs/{id}', [AcademicianController::class, 'deleteBlog']);
        // Events management
        Route::get('/events', [AcademicianController::class, 'events']);
        Route::post('/events', [AcademicianController::class, 'storeEvent']);
        // Academic resources
        Route::get('/resources', [AcademicianController::class, 'resources']);
        Route::post('/resources', [AcademicianController::class, 'storeResource']);
        // Permission approvals (from teacher attendance)
        Route::get('/permissions/pending', [AcademicianController::class, 'getPendingPermissions']);
        Route::put('/permissions/{id}/respond', [AcademicianController::class, 'respondPermission']);
    });

    // ────── Cashier Routes ──────
    Route::middleware('role:cashier')->prefix('cashier')->group(function () {
        Route::get('/dashboard', [CashierController::class, 'dashboard']);
        Route::get('/fees', [CashierController::class, 'fees']);
        Route::post('/fees', [CashierController::class, 'storeFee']);
        Route::post('/fines', [CashierController::class, 'storeFine']);
        Route::put('/fees/{id}/payment', [CashierController::class, 'recordPayment']);
        Route::get('/reports', [CashierController::class, 'reports']);
        Route::get('/students', [CashierController::class, 'students']);
        Route::get('/staff', [CashierController::class, 'getStaff']);
        Route::put('/staff/{id}/info', [CashierController::class, 'updateStaffInfo']);
        Route::put('/staff/{id}/salary', [CashierController::class, 'updateStaffSalary']);
        Route::put('/staff/{id}/bonus', [CashierController::class, 'updateStaffBonus']);
        Route::get('/parents', [CashierController::class, 'getParents']);
        Route::post('/parents/{id}/fee-reminder', [CashierController::class, 'sendFeeReminder']);
    });

    // ────── Head of School Routes ──────
    Route::middleware('role:head_of_school')->prefix('head-of-school')->group(function () {
        Route::get('/dashboard', [HeadOfSchoolController::class, 'dashboard']);
        Route::get('/staff', [HeadOfSchoolController::class, 'staff']);
        Route::get('/analytics', [HeadOfSchoolController::class, 'analytics']);
        // Legacy grade approval
        Route::get('/approvals/pending', [HeadOfSchoolController::class, 'pendingApprovals']);
        Route::put('/approvals/{id}', [HeadOfSchoolController::class, 'approveResults']);
        // Transcript approval
        Route::get('/transcripts/pending', [HeadOfSchoolController::class, 'pendingTranscripts']);
        Route::post('/transcripts/{id}/approve', [HeadOfSchoolController::class, 'approveTranscript']);
        Route::post('/transcripts/{id}/reject', [HeadOfSchoolController::class, 'rejectTranscript']);
        // Student management (specific paths before parameterized)
        Route::get('/students/classes', [HeadOfSchoolController::class, 'getClasses']);
        Route::get('/students/template/download', [HeadOfSchoolController::class, 'exportStudentTemplate']);
        Route::get('/students', [HeadOfSchoolController::class, 'getStudents']);
        Route::get('/students/{id}', [HeadOfSchoolController::class, 'getStudentMember']);
        // Parents
        Route::get('/parents', [HeadOfSchoolController::class, 'getParents']);
        Route::post('/students', [HeadOfSchoolController::class, 'storeSingleStudent']);
        Route::post('/students/import', [HeadOfSchoolController::class, 'importStudents']);
        Route::put('/students/{id}/status', [HeadOfSchoolController::class, 'updateStudentStatus']);
        Route::put('/students/{id}', [HeadOfSchoolController::class, 'updateStudent']);
        // Unified staff management
        Route::get('/staff/list', [HeadOfSchoolController::class, 'getStaff']);
        Route::get('/staff/{id}', [HeadOfSchoolController::class, 'getStaffMember']);
        Route::post('/staff', [HeadOfSchoolController::class, 'storeStaff']);
        Route::put('/staff/{id}', [HeadOfSchoolController::class, 'updateStaff']);
        Route::put('/staff/{id}/status', [HeadOfSchoolController::class, 'updateStaffStatus']);
        Route::delete('/staff/{id}', [HeadOfSchoolController::class, 'deleteStaff']);
        Route::post('/staff/{id}/approve-salary', [HeadOfSchoolController::class, 'approveStaffSalary']);
        Route::post('/staff/{id}/approve-bonus', [HeadOfSchoolController::class, 'approveStaffBonus']);
        // Unified approvals
        Route::get('/approvals', [HeadOfSchoolController::class, 'getApprovals']);
        Route::get('/approvals/categories', [HeadOfSchoolController::class, 'getApprovalCategories']);
        Route::get('/approvals/pending-counts', [HeadOfSchoolController::class, 'getPendingCounts']);
        Route::post('/approvals', [HeadOfSchoolController::class, 'createApproval']);
        Route::put('/approvals/{id}/respond', [HeadOfSchoolController::class, 'respondApproval']);
        // Fee / Fine final approval
        Route::get('/fees/pending', [HeadOfSchoolController::class, 'getPendingFees']);
        Route::put('/fees/{id}/approve', [HeadOfSchoolController::class, 'approveFee']);
    });

    // ────── Assistant Head Routes ──────
    Route::middleware('role:assistant_head')->prefix('assistant-head')->group(function () {
        Route::get('/dashboard', [AssistantHeadController::class, 'dashboard']);
        Route::get('/class-performance', [AssistantHeadController::class, 'classPerformance']);
        Route::get('/submissions', [AssistantHeadController::class, 'submissions']);
        // Unified staff management
        Route::get('/staff/list', [AssistantHeadController::class, 'getStaff']);
        Route::get('/staff/{id}', [AssistantHeadController::class, 'getStaffMember']);
        Route::post('/staff', [AssistantHeadController::class, 'storeStaff']);
        Route::put('/staff/{id}', [AssistantHeadController::class, 'updateStaff']);
        Route::put('/staff/{id}/status', [AssistantHeadController::class, 'updateStaffStatus']);
        Route::delete('/staff/{id}', [AssistantHeadController::class, 'deleteStaff']);
        Route::post('/staff/{id}/approve-salary', [AssistantHeadController::class, 'approveStaffSalary']);
        Route::post('/staff/{id}/approve-bonus', [AssistantHeadController::class, 'approveStaffBonus']);
        // Student management (specific paths before parameterized)
        Route::get('/students/classes', [AssistantHeadController::class, 'getClasses']);
        Route::get('/students/template/download', [AssistantHeadController::class, 'exportStudentTemplate']);
        Route::get('/students', [AssistantHeadController::class, 'getStudents']);
        Route::get('/students/{id}', [AssistantHeadController::class, 'getStudentMember']);
        // Parents
        Route::get('/parents', [AssistantHeadController::class, 'getParents']);
        Route::post('/students', [AssistantHeadController::class, 'storeSingleStudent']);
        Route::post('/students/import', [AssistantHeadController::class, 'importStudents']);
        Route::put('/students/{id}/status', [AssistantHeadController::class, 'updateStudentStatus']);
        Route::put('/students/{id}', [AssistantHeadController::class, 'updateStudent']);
        // Unified approvals
        Route::get('/approvals', [AssistantHeadController::class, 'getApprovals']);
        Route::get('/approvals/categories', [AssistantHeadController::class, 'getApprovalCategories']);
        Route::get('/approvals/pending-counts', [AssistantHeadController::class, 'getPendingCounts']);
        Route::post('/approvals', [AssistantHeadController::class, 'createApproval']);
        Route::put('/approvals/{id}/respond', [AssistantHeadController::class, 'respondApproval']);
        // Fee / Fine approval
        Route::get('/fees/pending', [AssistantHeadController::class, 'getPendingFees']);
        Route::put('/fees/{id}/review', [AssistantHeadController::class, 'reviewFee']);
    });

    // ────── Super Admin Routes (Cross-Tenant SaaS Vendor) ──────
    Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
        Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/schools', [SuperAdminController::class, 'schools']);
        Route::post('/schools', [SuperAdminController::class, 'storeSchool']);
        Route::get('/schools/{id}', [SuperAdminController::class, 'showSchool']);
        Route::put('/schools/{id}', [SuperAdminController::class, 'updateSchool']);
        Route::post('/schools/{id}/suspend', [SuperAdminController::class, 'suspendSchool']);
        // School user CRUD
        Route::post('/schools/{id}/users', [SuperAdminController::class, 'storeSchoolUser']);
        Route::put('/schools/{schoolId}/users/{userId}', [SuperAdminController::class, 'updateSchoolUser']);
        Route::delete('/schools/{schoolId}/users/{userId}', [SuperAdminController::class, 'deleteSchoolUser']);
        // Subscription & billing
        Route::get('/subscriptions', [SuperAdminController::class, 'subscriptions']);
        Route::put('/schools/{id}/subscription', [SuperAdminController::class, 'updateSubscription']);
        // Feature flags
        Route::get('/feature-flags', [SuperAdminController::class, 'featureFlags']);
        Route::post('/feature-flags', [SuperAdminController::class, 'storeFeatureFlag']);
        Route::put('/feature-flags/{id}', [SuperAdminController::class, 'updateFeatureFlag']);
        // Per-school feature assignment
        Route::get('/schools/{id}/features', [SuperAdminController::class, 'schoolFeatures']);
        Route::post('/schools/{id}/features/toggle', [SuperAdminController::class, 'toggleSchoolFeature']);
        // Cross-tenant analytics
        Route::get('/analytics', [SuperAdminController::class, 'analytics']);
    });

    // ────── Secretary Routes ──────
    Route::middleware('role:secretary')->prefix('secretary')->group(function () {
        Route::get('/dashboard', [SecretaryController::class, 'dashboard']);
        Route::get('/announcements', [SecretaryController::class, 'announcements']);
        Route::post('/announcements', [SecretaryController::class, 'storeAnnouncement']);
        Route::get('/users', [SecretaryController::class, 'users']);
        Route::post('/users', [SecretaryController::class, 'storeUser']);
        Route::get('/timetables', [SecretaryController::class, 'timetables']);
        Route::get('/exams', [SecretaryController::class, 'exams']);
    });

    // ────── Shared routes ──────
    Route::apiResource('fees', FeeController::class)->except(['create', 'edit'])->middleware('role:admin,head_of_school,assistant_head,cashier');
    Route::apiResource('books', LibraryController::class)->except(['create', 'edit']);
    Route::post('books/{book}/issue', [LibraryController::class, 'issue']);
    Route::post('books/{book}/return', [LibraryController::class, 'return']);
    Route::get('exams', [ExamController::class, 'index']);

    // ────── Notifications & SMS (Parent Portal / Tanzanian SMS Gateway) ──────
    Route::middleware('role:parent')->prefix('notifications')->group(function () {
        Route::get('/', [ParentController::class, 'notifications']);
        Route::post('/{id}/read', [ParentController::class, 'markNotificationRead']);
    });

    // ────── Assignments (Student Assignment Locker) ──────
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/assignments', [StudentController::class, 'assignments']);
        Route::post('/assignments/{id}/submit', [StudentController::class, 'submitAssignment']);
    });
    Route::middleware('role:teacher')->prefix('teacher')->group(function () {
        Route::post('/assignments', [TeacherController::class, 'storeAssignment']);
        Route::get('/assignments', [TeacherController::class, 'assignments']);
        Route::put('/assignments/{id}', [TeacherController::class, 'updateAssignment']);
        Route::delete('/assignments/{id}', [TeacherController::class, 'deleteAssignment']);
        Route::get('/assignments/{id}/submissions', [TeacherController::class, 'submissions']);
        Route::post('/assignments/{id}/grade', [TeacherController::class, 'gradeSubmission']);
        // Teacher remarks
        Route::post('/remarks', [TeacherController::class, 'storeRemark']);
        Route::get('/remarks', [TeacherController::class, 'remarks']);
    });

    // ────── Fee Invoicing & Debtors Ledger (Cashier enhancement) ──────
    Route::middleware('role:cashier')->prefix('cashier')->group(function () {
        Route::post('/fees/bulk-generate', [CashierController::class, 'bulkGenerateFees']);
        Route::get('/fees/invoices', [CashierController::class, 'invoices']);
        Route::post('/fees/{id}/receipt', [CashierController::class, 'generateReceipt']);
        Route::get('/debtors/aging', [CashierController::class, 'debtorsAging']);
        Route::post('/debtors/remind', [CashierController::class, 'sendBulkReminders']);
    });

    // ────── Parent Fee Payment Portal ──────
    Route::middleware('role:parent')->prefix('parent')->group(function () {
        Route::get('/payment-portal', [ParentController::class, 'paymentPortal']);
        Route::post('/generate-control-number', [ParentController::class, 'generateControlNumber']);
    });

    // ────── NECTA Grading & Report Card (Academician enhancement) ──────
    Route::middleware('role:academician')->prefix('academician')->group(function () {
        Route::post('/grading/necta', [AcademicianController::class, 'computeNectaGrades']);
        Route::get('/grading/necta-config', [AcademicianController::class, 'nectaGradingConfig']);
        Route::post('/grading/necta-config', [AcademicianController::class, 'saveNectaGradingConfig']);
        Route::post('/report-cards/generate', [AcademicianController::class, 'generateReportCards']);
        Route::post('/timetables/conflict-free', [AcademicianController::class, 'generateConflictFreeTimetable']);
    });

    // ────── School Profile Configuration (Head of School / Super Admin) ──────
    Route::middleware('role:head_of_school,super_admin')->prefix('school')->group(function () {
        Route::get('/profile', [HeadOfSchoolController::class, 'schoolProfile']);
        Route::put('/profile', [HeadOfSchoolController::class, 'updateSchoolProfile']);
        Route::get('/terms', [HeadOfSchoolController::class, 'getTerms']);
        Route::post('/terms', [HeadOfSchoolController::class, 'storeTerm']);
    });

    // ────── Tanzanian Localization ──────
    Route::post('/locale', [AuthController::class, 'setLocale']);
});
