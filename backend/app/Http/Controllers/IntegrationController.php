<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function connect(string $type, Request $request): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Not implemented.'], 501);
    }

    public function disconnect(string $type): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Not implemented.'], 501);
    }

    public function configure(string $type, Request $request): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Not implemented.'], 501);
    }
}
