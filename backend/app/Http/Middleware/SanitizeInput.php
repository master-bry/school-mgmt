<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->isJson() || $request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            $input = $request->all();
            array_walk_recursive($input, function (&$value) {
                if (is_string($value)) {
                    $value = strip_tags($value);
                    $value = trim($value);
                }
            });
            $request->merge($input);
        }

        return $next($request);
    }
}
