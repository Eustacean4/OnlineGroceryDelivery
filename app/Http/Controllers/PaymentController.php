<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'method' => 'required|string|in:card,bank_transfer,cash,stripe',
            'stripe_payment_intent_id' => 'nullable|string',
        ]);

        $order = Order::where('id', $request->order_id)
                      ->where('user_id', Auth::id())
                      ->firstOrFail();

        // Prevent duplicate payment
        if ($order->payment) {
            return response()->json(['message' => 'Payment already exists'], 409);
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => $request->method,
            'status' => $request->method === 'cash' ? 'pending' : 'paid',
            'stripe_payment_intent_id' => $request->stripe_payment_intent_id,
            'paid_at' => $request->method !== 'cash' ? now() : null,
        ]);

        // Update order status based on payment method
        if ($request->method === 'stripe') {
            $order->update(['status' => 'processing']);
        } elseif ($request->method !== 'cash') {
            $order->update(['status' => 'processing']);
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment
        ], 201);
    }

    public function show($id)
    {
        $payment = Payment::with('order')->findOrFail($id);
        return response()->json($payment);
    }

    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'string|in:usd,try,eur'
        ]);

        try {
            Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

            $paymentIntent = PaymentIntent::create([
                'amount' => $request->amount * 100, // Convert to cents
                'currency' => $request->currency ?? 'try',
                'metadata' => [
                    'user_id' => Auth::id(),
                ],
            ]);

            return response()->json([
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}