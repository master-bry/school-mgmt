<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LocationController extends Controller
{
    public function countries()
    {
        return Cache::remember('locations.countries', 86400, function () {
            $response = Http::timeout(10)->get('https://restcountries.com/v3.1/all?fields=name,cca2,demonyms');
            if (!$response->successful()) {
                return response()->json([]);
            }
            $countries = collect($response->json())->map(function ($c) {
                return [
                    'name' => $c['name']['common'] ?? '',
                    'code' => $c['cca2'] ?? '',
                    'nationality' => $c['demonyms']['eng']['m'] ?? ($c['demonyms']['eng']['f'] ?? ''),
                ];
            })->sortBy('name')->values();
            return $countries;
        });
    }

    public function cities(Request $request)
    {
        $country = $request->query('country');
        if (!$country) {
            return response()->json([]);
        }

        $cacheKey = 'locations.cities.' . md5($country);
        return Cache::remember($cacheKey, 86400, function () use ($country) {
            $response = Http::timeout(10)->post('https://countriesnow.space/api/v0.1/countries/cities', [
                'country' => $country,
            ]);
            if ($response->successful()) {
                $body = $response->json();
                if (isset($body['error']) && $body['error'] === false && isset($body['data'])) {
                    return $body['data'];
                }
            }
            return [];
        });
    }
}
