<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = Announcement::with('createdBy')->latest()->get();
        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|string|max:50',
            'is_public' => 'sometimes|boolean',
        ]);

        $announcement = Announcement::create([
            'school_id' => auth()->user()->school_id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category ?? 'general',
            'is_public' => $request->boolean('is_public', false),
            'created_by' => auth()->id(),
        ]);

        return response()->json($announcement->load('createdBy'), 201);
    }

    public function show($id)
    {
        $announcement = Announcement::with('createdBy')->findOrFail($id);
        return response()->json($announcement);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->update($request->only('title', 'content', 'category', 'is_public'));
        return response()->json($announcement->load('createdBy'));
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();
        return response()->json(null, 204);
    }

    public function publicIndex()
    {
        $announcements = Announcement::withoutSchool()->public()
            ->with('createdBy')
            ->latest()
            ->get();
        return response()->json($announcements);
    }
}
