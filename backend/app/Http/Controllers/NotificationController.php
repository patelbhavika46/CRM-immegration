<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::forUser(auth()->id())->latest('created_at');

        if ($request->boolean('unread')) {
            $query->unread();
        }

        $paginator = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'success'      => true,
            'data'         => $paginator->items(),
            'unread_count' => Notification::forUser(auth()->id())->unread()->count(),
            'meta'         => [
                'current_page' => $paginator->currentPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function markRead(int $id): JsonResponse
    {
        $notification = Notification::forUser(auth()->id())->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Notification marked as read.']);
    }

    public function markAllRead(): JsonResponse
    {
        Notification::forUser(auth()->id())
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function destroy(int $id): JsonResponse
    {
        Notification::forUser(auth()->id())->findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Notification deleted.']);
    }
}
