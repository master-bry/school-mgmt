<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookLoan;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    public function index()
    {
        $books = Book::all();
        return response()->json($books);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => 'required|string|unique:books',
            'total_copies' => 'required|integer|min:1',
        ]);

        $book = Book::create(array_merge($request->only(['title', 'author', 'isbn', 'total_copies', 'published_year', 'publisher']), [
            'available_copies' => $request->total_copies,
        ]));

        return response()->json($book, 201);
    }

    public function show($id)
    {
        $book = Book::with('loans.user')->findOrFail($id);
        return response()->json($book);
    }

    public function update(Request $request, $id)
    {
        $book = Book::findOrFail($id);
        $book->update($request->only(['title', 'author', 'isbn', 'total_copies', 'available_copies', 'published_year', 'publisher']));
        return response()->json($book);
    }

    public function destroy($id)
    {
        $book = Book::findOrFail($id);
        $book->delete();
        return response()->json(null, 204);
    }

    public function issue(Request $request, $id)
    {
        $book = Book::findOrFail($id);

        if (!$book->isAvailable()) {
            return response()->json([
                'message' => 'No copies available',
            ], 400);
        }

        $loan = BookLoan::create([
            'book_id' => $book->id,
            'user_id' => $request->user_id,
            'issue_date' => now(),
            'due_date' => now()->addDays(14),
            'status' => 'issued',
        ]);

        $book->decrement('available_copies');

        return response()->json($loan, 201);
    }

    public function return(Request $request, Book $book)
    {
        $loan = $book->loans()->where('status', 'issued')->latest()->first();

        if (!$loan) {
            return response()->json([
                'message' => 'No active loan found for this book',
            ], 400);
        }

        $loan->update([
            'return_date' => now(),
            'status' => 'returned',
        ]);

        $book->increment('available_copies');

        return response()->json($loan);
    }
}
