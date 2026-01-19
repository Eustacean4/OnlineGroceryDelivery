<?php
// app/Http/Controllers/PaymentMethodsController.php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class PaymentMethodsController extends Controller
{
    /**
     * Get all payment methods for the authenticated user
     */
    public function index()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                Log::warning('Unauthenticated user trying to access payment methods');
                return response()->json(['message' => 'User not authenticated'], 401);
            }

            Log::info('Fetching payment methods for user: ' . $user->id);

            $paymentMethods = $user->paymentMethods()->latest()->get();
            
            Log::info('Found ' . $paymentMethods->count() . ' payment methods for user: ' . $user->id);
            
            // Transform data for frontend (mask card numbers, hide CVV)
            $transformedMethods = $paymentMethods->map(function ($method) {
                return [
                    'id' => $method->id,
                    'card_type' => $method->card_type,
                    'card_number' => $this->maskCardNumber($method->card_number),
                    'card_holder_name' => $method->card_holder_name,
                    'expiry_month' => $method->expiry_month,
                    'expiry_year' => $method->expiry_year,
                    'is_default' => $method->is_default,
                    'display_name' => $method->display_name ?? $this->getDisplayName($method),
                    'created_at' => $method->created_at
                ];
            });

            return response()->json($transformedMethods);
            
        } catch (Exception $e) {
            Log::error('Payment methods fetch error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Failed to fetch payment methods',
                'error' => $e->getMessage() // Remove this in production
            ], 500);
        }
    }

    /**
     * Store a new payment method
     */
    public function store(Request $request)
    {
        try {
            Log::info('Attempting to store payment method', $request->all());

            // FIXED VALIDATION RULES - No problematic regex patterns
            $validator = Validator::make($request->all(), [
                'card_type' => 'required|string|in:visa,mastercard,amex',
                'card_number' => 'required|string|min:13|max:19',
                'card_holder_name' => 'required|string|max:255',
                'expiry_month' => [
                    'required',
                    'string',
                    'size:2',
                    'regex:/^(0[1-9]|1[0-2])$/'
                ],
                'expiry_year' => 'required|integer|min:2025|max:2050',
                'cvv' => [
                    'required',
                    'string',
                    'min:3',
                    'max:4',
                    'regex:/^[0-9]{3,4}$/'
                ],
            ], [
                'expiry_month.regex' => 'Expiry month must be between 01 and 12',
                'expiry_year.min' => 'Expiry year must be 2025 or later',
                'expiry_year.max' => 'Expiry year must not exceed 2050',
                'cvv.regex' => 'CVV must be 3 or 4 digits'
            ]);

            if ($validator->fails()) {
                Log::warning('Payment method validation failed', $validator->errors()->toArray());
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Clean card number
            $cardNumber = preg_replace('/\s+/', '', $request->card_number);
            
            // Validate card number
            if (!$this->isValidCardNumber($cardNumber)) {
                return response()->json([
                    'message' => 'Invalid card number'
                ], 422);
            }

            // Check expiry date
            $currentYear = date('Y');
            $currentMonth = date('m');
            
            if ($request->expiry_year < $currentYear || 
                ($request->expiry_year == $currentYear && $request->expiry_month < $currentMonth)) {
                return response()->json([
                    'message' => 'Card has expired'
                ], 422);
            }

            // Check if this is the user's first card (make it default)
            $user = Auth::user();
            $isFirstCard = $user->paymentMethods()->count() === 0;

            $paymentMethod = $user->paymentMethods()->create([
                'card_type' => $request->card_type,
                'card_number' => $cardNumber,
                'card_holder_name' => $request->card_holder_name,
                'expiry_month' => $request->expiry_month,
                'expiry_year' => $request->expiry_year,
                'cvv' => $request->cvv,
                'is_default' => $isFirstCard || $request->boolean('is_default', false),
                'display_name' => $this->getDisplayName((object)[
                    'card_type' => $request->card_type,
                    'card_number' => $cardNumber
                ])
            ]);

            // If this is set as default, unset others
            if ($paymentMethod->is_default) {
                $user->paymentMethods()
                    ->where('id', '!=', $paymentMethod->id)
                    ->update(['is_default' => false]);
            }

            Log::info('Payment method created successfully', ['id' => $paymentMethod->id]);

            return response()->json([
                'id' => $paymentMethod->id,
                'card_type' => $paymentMethod->card_type,
                'card_number' => $this->maskCardNumber($paymentMethod->card_number),
                'card_holder_name' => $paymentMethod->card_holder_name,
                'expiry_month' => $paymentMethod->expiry_month,
                'expiry_year' => $paymentMethod->expiry_year,
                'is_default' => $paymentMethod->is_default,
                'display_name' => $paymentMethod->display_name
            ], 201);

        } catch (Exception $e) {
            Log::error('Payment method store error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Failed to save payment method',
                'error' => $e->getMessage() // Remove this in production
            ], 500);
        }
    }

    /**
     * Delete a payment method
     */
    public function destroy($id)
    {
        try {
            $paymentMethod = Auth::user()->paymentMethods()->find($id);

            if (!$paymentMethod) {
                return response()->json([
                    'message' => 'Payment method not found'
                ], 404);
            }

            $paymentMethod->delete();

            Log::info('Payment method deleted successfully', ['id' => $id]);

            return response()->json([
                'message' => 'Payment method deleted successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Payment method delete error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete payment method',
                'error' => $e->getMessage() // Remove this in production
            ], 500);
        }
    }

    /**
     * Set a payment method as default
     */
    public function setDefault($id)
    {
        try {
            $paymentMethod = Auth::user()->paymentMethods()->find($id);

            if (!$paymentMethod) {
                return response()->json([
                    'message' => 'Payment method not found'
                ], 404);
            }

            // Unset all other default methods
            Auth::user()->paymentMethods()->update(['is_default' => false]);
            
            // Set this one as default
            $paymentMethod->update(['is_default' => true]);

            Log::info('Default payment method updated', ['id' => $id]);

            return response()->json([
                'message' => 'Default payment method updated'
            ]);

        } catch (Exception $e) {
            Log::error('Payment method set default error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update default payment method',
                'error' => $e->getMessage() // Remove this in production
            ], 500);
        }
    }

    /**
     * Basic Luhn algorithm for card validation
     */
    private function isValidCardNumber($cardNumber)
    {
        $cardNumber = preg_replace('/\D/', '', $cardNumber);
        
        if (strlen($cardNumber) < 13 || strlen($cardNumber) > 19) {
            return false;
        }

        $sum = 0;
        $length = strlen($cardNumber);
        
        for ($i = $length - 1; $i >= 0; $i--) {
            $digit = (int) $cardNumber[$i];
            
            if (($length - $i) % 2 === 0) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }
            
            $sum += $digit;
        }
        
        return $sum % 10 === 0;
    }

    /**
     * Mask card number for display
     */
    private function maskCardNumber($cardNumber)
    {
        if (strlen($cardNumber) < 4) {
            return str_repeat('*', strlen($cardNumber));
        }
        return str_repeat('*', strlen($cardNumber) - 4) . substr($cardNumber, -4);
    }

    /**
     * Generate display name for card
     */
    private function getDisplayName($method)
    {
        $type = ucfirst($method->card_type);
        $lastFour = substr($method->card_number, -4);
        return "{$type} ending in {$lastFour}";
    }
}