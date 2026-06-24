<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index()
    {
        $query = ClassModel::with('teacher', 'students')->where('school_id', auth()->user()->school_id);

        if (auth()->user()->isTeacher()) {
            $query->where('teacher_id', auth()->id());
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'section' => 'nullable|string|max:255',
            'teacher_id' => 'nullable|exists:users,id',
            'capacity' => 'nullable|integer|min:1',
            'room_number' => 'nullable|string|max:50',
        ]);

        $class = ClassModel::create(array_merge(
            $request->only(['name', 'section', 'teacher_id', 'capacity', 'room_number']),
            ['school_id' => auth()->user()->school_id]
        ));

        return response()->json($class, 201);
    }

    public function show($id)
    {
        $class = ClassModel::with('teacher', 'students', 'subjects')->where('school_id', auth()->user()->school_id)->findOrFail($id);
        return response()->json($class);
    }

    public function update(Request $request, $id)
    {
        $class = ClassModel::where('school_id', auth()->user()->school_id)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'section' => 'nullable|string|max:255',
            'teacher_id' => 'nullable|exists:users,id',
            'capacity' => 'nullable|integer|min:1',
            'room_number' => 'nullable|string|max:50',
        ]);

        $class->update($request->only(['name', 'section', 'teacher_id', 'capacity', 'room_number']));

        return response()->json($class);
    }

    public function destroy($id)
    {
        $class = ClassModel::where('school_id', auth()->user()->school_id)->findOrFail($id);
        $class->delete();

        return response()->json(null, 204);
    }
}
