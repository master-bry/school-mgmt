<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LocationController extends Controller
{
    private array $phoneCodes = [
        'AF' => '93', 'AL' => '355', 'DZ' => '213', 'AD' => '376', 'AO' => '244',
        'AG' => '1-268', 'AR' => '54', 'AM' => '374', 'AU' => '61', 'AT' => '43',
        'AZ' => '994', 'BS' => '1-242', 'BH' => '973', 'BD' => '880', 'BB' => '1-246',
        'BY' => '375', 'BE' => '32', 'BZ' => '501', 'BJ' => '229', 'BT' => '975',
        'BO' => '591', 'BA' => '387', 'BW' => '267', 'BR' => '55', 'BN' => '673',
        'BG' => '359', 'BF' => '226', 'BI' => '257', 'KH' => '855', 'CM' => '237',
        'CA' => '1', 'CV' => '238', 'CF' => '236', 'TD' => '235', 'CL' => '56',
        'CN' => '86', 'CO' => '57', 'KM' => '269', 'CG' => '242', 'CD' => '243',
        'CR' => '506', 'CI' => '225', 'HR' => '385', 'CU' => '53', 'CY' => '357',
        'CZ' => '420', 'DK' => '45', 'DJ' => '253', 'DM' => '1-767', 'DO' => '1-809',
        'EC' => '593', 'EG' => '20', 'SV' => '503', 'GQ' => '240', 'ER' => '291',
        'EE' => '372', 'ET' => '251', 'FJ' => '679', 'FI' => '358', 'FR' => '33',
        'GA' => '241', 'GM' => '220', 'GE' => '995', 'DE' => '49', 'GH' => '233',
        'GR' => '30', 'GD' => '1-473', 'GT' => '502', 'GN' => '224', 'GW' => '245',
        'GY' => '592', 'HT' => '509', 'HN' => '504', 'HU' => '36', 'IS' => '354',
        'IN' => '91', 'ID' => '62', 'IR' => '98', 'IQ' => '964', 'IE' => '353',
        'IL' => '972', 'IT' => '39', 'JM' => '1-876', 'JP' => '81', 'JO' => '962',
        'KZ' => '7', 'KE' => '254', 'KI' => '686', 'KP' => '850', 'KR' => '82',
        'KW' => '965', 'KG' => '996', 'LA' => '856', 'LV' => '371', 'LB' => '961',
        'LS' => '266', 'LR' => '231', 'LY' => '218', 'LI' => '423', 'LT' => '370',
        'LU' => '352', 'MK' => '389', 'MG' => '261', 'MW' => '265', 'MY' => '60',
        'MV' => '960', 'ML' => '223', 'MT' => '356', 'MH' => '692', 'MR' => '222',
        'MU' => '230', 'MX' => '52', 'FM' => '691', 'MD' => '373', 'MC' => '377',
        'MN' => '976', 'ME' => '382', 'MA' => '212', 'MZ' => '258', 'MM' => '95',
        'NA' => '264', 'NR' => '674', 'NP' => '977', 'NL' => '31', 'NZ' => '64',
        'NI' => '505', 'NE' => '227', 'NG' => '234', 'NO' => '47', 'OM' => '968',
        'PK' => '92', 'PW' => '680', 'PA' => '507', 'PG' => '675', 'PY' => '595',
        'PE' => '51', 'PH' => '63', 'PL' => '48', 'PT' => '351', 'QA' => '974',
        'RO' => '40', 'RU' => '7', 'RW' => '250', 'KN' => '1-869', 'LC' => '1-758',
        'VC' => '1-784', 'WS' => '685', 'SM' => '378', 'ST' => '239', 'SA' => '966',
        'SN' => '221', 'RS' => '381', 'SC' => '248', 'SL' => '232', 'SG' => '65',
        'SK' => '421', 'SI' => '386', 'SB' => '677', 'SO' => '252', 'ZA' => '27',
        'SS' => '211', 'ES' => '34', 'LK' => '94', 'SD' => '249', 'SR' => '597',
        'SZ' => '268', 'SE' => '46', 'CH' => '41', 'SY' => '963', 'TW' => '886',
        'TJ' => '992', 'TZ' => '255', 'TH' => '66', 'TL' => '670', 'TG' => '228',
        'TO' => '676', 'TT' => '1-868', 'TN' => '216', 'TR' => '90', 'TM' => '993',
        'TV' => '688', 'UG' => '256', 'UA' => '380', 'AE' => '971', 'GB' => '44',
        'US' => '1', 'UY' => '598', 'UZ' => '998', 'VU' => '678', 'VA' => '379',
        'VE' => '58', 'VN' => '84', 'YE' => '967', 'ZM' => '260', 'ZW' => '263',
    ];

    private array $demonyms = [
        'AF' => 'Afghan', 'AL' => 'Albanian', 'DZ' => 'Algerian', 'AD' => 'Andorran',
        'AO' => 'Angolan', 'AG' => 'Antiguan', 'AR' => 'Argentinian', 'AM' => 'Armenian',
        'AU' => 'Australian', 'AT' => 'Austrian', 'AZ' => 'Azerbaijani', 'BS' => 'Bahamian',
        'BH' => 'Bahraini', 'BD' => 'Bangladeshi', 'BB' => 'Barbadian', 'BY' => 'Belarusian',
        'BE' => 'Belgian', 'BZ' => 'Belizean', 'BJ' => 'Beninese', 'BT' => 'Bhutanese',
        'BO' => 'Bolivian', 'BA' => 'Bosnian', 'BW' => 'Motswana', 'BR' => 'Brazilian',
        'BN' => 'Bruneian', 'BG' => 'Bulgarian', 'BF' => 'Burkinabe', 'BI' => 'Burundian',
        'KH' => 'Cambodian', 'CM' => 'Cameroonian', 'CA' => 'Canadian', 'CV' => 'Cape Verdean',
        'CF' => 'Central African', 'TD' => 'Chadian', 'CL' => 'Chilean', 'CN' => 'Chinese',
        'CO' => 'Colombian', 'KM' => 'Comorian', 'CG' => 'Congolese', 'CD' => 'Congolese',
        'CR' => 'Costa Rican', 'CI' => 'Ivorian', 'HR' => 'Croatian', 'CU' => 'Cuban',
        'CY' => 'Cypriot', 'CZ' => 'Czech', 'DK' => 'Danish', 'DJ' => 'Djiboutian',
        'DM' => 'Dominican', 'DO' => 'Dominican', 'EC' => 'Ecuadorian', 'EG' => 'Egyptian',
        'SV' => 'Salvadoran', 'GQ' => 'Equatorial Guinean', 'ER' => 'Eritrean',
        'EE' => 'Estonian', 'ET' => 'Ethiopian', 'FJ' => 'Fijian', 'FI' => 'Finnish',
        'FR' => 'French', 'GA' => 'Gabonese', 'GM' => 'Gambian', 'GE' => 'Georgian',
        'DE' => 'German', 'GH' => 'Ghanaian', 'GR' => 'Greek', 'GD' => 'Grenadian',
        'GT' => 'Guatemalan', 'GN' => 'Guinean', 'GW' => 'Bissau-Guinean', 'GY' => 'Guyanese',
        'HT' => 'Haitian', 'HN' => 'Honduran', 'HU' => 'Hungarian', 'IS' => 'Icelandic',
        'IN' => 'Indian', 'ID' => 'Indonesian', 'IR' => 'Iranian', 'IQ' => 'Iraqi',
        'IE' => 'Irish', 'IL' => 'Israeli', 'IT' => 'Italian', 'JM' => 'Jamaican',
        'JP' => 'Japanese', 'JO' => 'Jordanian', 'KZ' => 'Kazakh', 'KE' => 'Kenyan',
        'KI' => 'I-Kiribati', 'KP' => 'North Korean', 'KR' => 'South Korean',
        'KW' => 'Kuwaiti', 'KG' => 'Kyrgyz', 'LA' => 'Lao', 'LV' => 'Latvian',
        'LB' => 'Lebanese', 'LS' => 'Basotho', 'LR' => 'Liberian', 'LY' => 'Libyan',
        'LI' => 'Liechtensteiner', 'LT' => 'Lithuanian', 'LU' => 'Luxembourgish',
        'MK' => 'Macedonian', 'MG' => 'Malagasy', 'MW' => 'Malawian', 'MY' => 'Malaysian',
        'MV' => 'Maldivian', 'ML' => 'Malian', 'MT' => 'Maltese', 'MH' => 'Marshallese',
        'MR' => 'Mauritanian', 'MU' => 'Mauritian', 'MX' => 'Mexican', 'FM' => 'Micronesian',
        'MD' => 'Moldovan', 'MC' => 'Monegasque', 'MN' => 'Mongolian', 'ME' => 'Montenegrin',
        'MA' => 'Moroccan', 'MZ' => 'Mozambican', 'MM' => 'Burmese', 'NA' => 'Namibian',
        'NR' => 'Nauruan', 'NP' => 'Nepali', 'NL' => 'Dutch', 'NZ' => 'New Zealander',
        'NI' => 'Nicaraguan', 'NE' => 'Nigerien', 'NG' => 'Nigerian', 'NO' => 'Norwegian',
        'OM' => 'Omani', 'PK' => 'Pakistani', 'PW' => 'Palauan', 'PA' => 'Panamanian',
        'PG' => 'Papua New Guinean', 'PY' => 'Paraguayan', 'PE' => 'Peruvian',
        'PH' => 'Filipino', 'PL' => 'Polish', 'PT' => 'Portuguese', 'QA' => 'Qatari',
        'RO' => 'Romanian', 'RU' => 'Russian', 'RW' => 'Rwandan', 'KN' => 'Kittitian',
        'LC' => 'Saint Lucian', 'VC' => 'Vincentian', 'WS' => 'Samoan', 'SM' => 'Sammarinese',
        'ST' => 'São Toméan', 'SA' => 'Saudi', 'SN' => 'Senegalese', 'RS' => 'Serbian',
        'SC' => 'Seychellois', 'SL' => 'Sierra Leonean', 'SG' => 'Singaporean',
        'SK' => 'Slovak', 'SI' => 'Slovenian', 'SB' => 'Solomon Islander', 'SO' => 'Somali',
        'ZA' => 'South African', 'SS' => 'South Sudanese', 'ES' => 'Spanish',
        'LK' => 'Sri Lankan', 'SD' => 'Sudanese', 'SR' => 'Surinamese', 'SZ' => 'Swazi',
        'SE' => 'Swedish', 'CH' => 'Swiss', 'SY' => 'Syrian', 'TW' => 'Taiwanese',
        'TJ' => 'Tajik', 'TZ' => 'Tanzanian', 'TH' => 'Thai', 'TL' => 'Timorese',
        'TG' => 'Togolese', 'TO' => 'Tongan', 'TT' => 'Trinidadian', 'TN' => 'Tunisian',
        'TR' => 'Turkish', 'TM' => 'Turkmen', 'TV' => 'Tuvaluan', 'UG' => 'Ugandan',
        'UA' => 'Ukrainian', 'AE' => 'Emirati', 'GB' => 'British', 'US' => 'American',
        'UY' => 'Uruguayan', 'UZ' => 'Uzbek', 'VU' => 'Ni-Vanuatu', 'VA' => 'Vatican',
        'VE' => 'Venezuelan', 'VN' => 'Vietnamese', 'YE' => 'Yemeni', 'ZM' => 'Zambian',
        'ZW' => 'Zimbabwean',
    ];

    public function countries()
    {
        return Cache::remember('locations.countries', 86400, function () {
            $response = Http::timeout(30)->get('https://countriesnow.space/api/v0.1/countries');
            if (!$response->successful()) {
                return [];
            }

            $body = $response->json();
            if (($body['error'] ?? true) || !isset($body['data'])) {
                return [];
            }

            return collect($body['data'])->map(function ($c) {
                $code = strtoupper($c['iso2'] ?? '');
                $name = $c['country'] ?? '';

                return [
                    'name' => $name,
                    'code' => $code,
                    'nationality' => $this->demonyms[$code] ?? $name,
                    'phone_code' => $this->phoneCodes[$code] ?? null,
                    'flag' => $code ? 'https://flagcdn.com/w640/' . strtolower($code) . '.png' : null,
                ];
            })->filter(fn($c) => $c['code'] && $c['name'])
              ->sortBy('name')
              ->values();
        });
    }

    public function cities(Request $request)
    {
        $country = $request->query('country');
        if (!$country) {
            return [];
        }

        $cacheKey = 'locations.cities.' . md5($country);
        return Cache::remember($cacheKey, 86400, function () use ($country) {
            $response = Http::timeout(30)->get('https://countriesnow.space/api/v0.1/countries');
            if (!$response->successful()) {
                return [];
            }

            $body = $response->json();
            if (($body['error'] ?? true) || !isset($body['data'])) {
                return [];
            }

            $found = collect($body['data'])->firstWhere('country', $country);
            return $found['cities'] ?? [];
        });
    }
}
