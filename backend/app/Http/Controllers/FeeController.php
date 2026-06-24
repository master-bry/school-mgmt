<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use App\Models\User;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    public function index()
    {
        $fees = Fee::with('student')->where('school_id', auth()->user()->school_id)->get();
        return response()->json($fees);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'fee_type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        $fee = Fee::create([
            'student_id' => $request->student_id,
            'fee_type' => $request->fee_type,
            'amount' => $request->amount,
            'due_date' => $request->due_date,
            'status' => 'pending',
            'school_id' => auth()->user()->school_id,
        ]);

        return response()->json($fee, 201);
    }

    public function show($id)
    {
        $fee = Fee::with('student')->where('school_id', auth()->user()->school_id)->findOrFail($id);
        return response()->json($fee);
    }

    public function update(Request $request, $id)
    {
        $fee = Fee::where('school_id', auth()->user()->school_id)->findOrFail($id);

        $request->validate([
            'paid_amount' => 'sometimes|required|numeric|min:0',
            'paid_date' => 'sometimes|required|date',
            'payment_method' => 'sometimes|required|string',
            'transaction_id' => 'nullable|string',
        ]);

        $fee->update($request->only(['paid_amount', 'paid_date', 'payment_method', 'transaction_id']));

        if ($fee->paid_amount >= $fee->amount) {
            $fee->status = 'paid';
        } elseif ($fee->paid_amount > 0) {
            $fee->status = 'partial';
        }

        $fee->save();

        return response()->json($fee);
    }

    public function destroy($id)
    {
        $fee = Fee::where('school_id', auth()->user()->school_id)->findOrFail($id);
        $fee->delete();

        return response()->json(null, 204);
    }

    public function childFees($id)
    {
        $child = User::where('id', $id)
            ->where('parent_id', auth()->id())
            ->firstOrFail();

        $fees = $child->fees()
            ->where('approval_status', 'approved')
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json($fees);
    }

    public function studentFees()
    {
        $student = auth()->user();
        if ($student->role !== 'student') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fees = $student->fees()
            ->where('approval_status', 'approved')
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json($fees);
    }
}
