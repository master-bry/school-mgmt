<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckFeature
{
    public function handle(Request $request, Closure $next, string $feature)
    {
        $user = $request->user();
        if (!$user || !$user->school_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $school = $user->school;
        if (!$school || !$school->featureEnabled($feature)) {
            return response()->json(['message' => 'Feature not enabled for this school'], 403);
        }

        return $next($request);
    }
}
