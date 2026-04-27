<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Not found.'], 404);
    }

    public function refund(int $id): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Not implemented.'], 501);
    }
}
