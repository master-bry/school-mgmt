<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\School;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'school_code' => 'nullable|string|exists:schools,code',
        ]);

        $schoolId = null;
        if ($request->school_code) {
            $school = School::where('code', $request->school_code)->first();
            $schoolId = $school?->id;
        }

        $user = User::create([
            'school_id' => $schoolId,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('school'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('school', 'class'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->load('school', 'class'));
    }

    public function publicAnnouncements()
    {
        $announcements = Announcement::withoutSchool()->public()
            ->with('createdBy')
            ->latest()
            ->get();

        return response()->json($announcements);
    }

    public function schools()
    {
        $schools = School::where('is_active', true)->get(['id', 'name', 'code']);
        return response()->json($schools);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'profile_image' => 'nullable|string|max:2048',
        ]);

        $user->update($request->only('name', 'phone', 'address', 'date_of_birth', 'profile_image'));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()->load('school', 'class'),
        ]);
    }

    public function setLocale(Request $request)
    {
        $request->validate([
            'locale' => 'required|string|in:en,sw',
        ]);

        $user = $request->user();
        if ($user->school_id) {
            $school = $user->school;
            if ($school) {
                $school->update(['locale' => $request->locale]);
            }
        }

        return response()->json([
            'message' => 'Locale updated to ' . $request->locale,
            'locale' => $request->locale,
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}
