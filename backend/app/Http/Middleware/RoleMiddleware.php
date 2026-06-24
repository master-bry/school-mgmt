<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $allowed = explode(',', $roles);

        foreach ($allowed as $role) {
            if ($request->user()->role === trim($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. Access restricted to: ' . implode(', ', $allowed) . '.',
        ], 403);
    }
}
