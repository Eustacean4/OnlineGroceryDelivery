<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RiderController extends Controller
{
    // View all orders assigned to the authenticated rider
    public function assignedOrders()
    {
        $user = Auth::user();

        if ($user->role !== 'rider') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orders = Order::with('items.product', 'payment', 'address')
            ->where('rider_id', $user->id)
            ->get();

        return response()->json($orders);
    }

    // Update delivery status & optionally mark payment as paid
    public function updateDeliveryStatus(Request $request, $orderId)
    {
        $user = Auth::user();

        if ($user->role !== 'rider') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:shipped,delivered',
            'mark_paid' => 'boolean',
        ]);

        $order = Order::with('payment')->where('id', $orderId)->where('rider_id', $user->id)->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found or not assigned to you'], 404);
        }

        $order->status = $request->status;
        $order->save();

        if ($request->mark_paid && $order->payment && in_array($order->payment->method, ['cash', 'card'])) {
            $order->payment->status = 'paid';
            $order->payment->paid_at = now();
            $order->payment->save();
        }

        return response()->json([
            'message' => 'Order updated successfully',
            'order' => $order,
        ]);
    }
}
