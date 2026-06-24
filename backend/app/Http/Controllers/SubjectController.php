<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Subject::with('teacher', 'classes')->where('school_id', auth()->user()->school_id)->get();
        return response()->json($subjects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:subjects',
            'description' => 'nullable|string',
            'teacher_id' => 'nullable|exists:users,id',
            'credits' => 'nullable|integer|min:1',
        ]);

        $subject = Subject::create(array_merge(
            $request->only(['name', 'code', 'description', 'teacher_id', 'credits']),
            ['school_id' => auth()->user()->school_id]
        ));

        return response()->json($subject, 201);
    }

    public function show($id)
    {
        $subject = Subject::with('teacher', 'classes')->where('school_id', auth()->user()->school_id)->findOrFail($id);
        return response()->json($subject);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::where('school_id', auth()->user()->school_id)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:subjects,code,'.$id,
            'description' => 'nullable|string',
            'teacher_id' => 'nullable|exists:users,id',
            'credits' => 'nullable|integer|min:1',
        ]);

        $subject->update($request->only(['name', 'code', 'description', 'teacher_id', 'credits']));

        return response()->json($subject);
    }

    public function destroy($id)
    {
        $subject = Subject::where('school_id', auth()->user()->school_id)->findOrFail($id);
        $subject->delete();

        return response()->json(null, 204);
    }
}
