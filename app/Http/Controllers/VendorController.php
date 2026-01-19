<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Business;

class VendorController extends Controller
{
    public function businesses(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'vendor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $businesses = Business::where('user_id', $user->id)->get();
        
        return response()->json($businesses);
    }
    // VendorController.php
    public function dashboardSummary(Request $request)
    {
        $vendorId = auth()->user()->id;

        $businesses = Business::where('vendor_id', $vendorId)
            ->with(['orders' => function ($query) {
                $query->where('status', '!=', 'cancelled'); // optional filter
            }])
            ->get()
            ->map(function ($business) {
                $totalRevenue = $business->orders->sum('total_price');
                $totalOrders = $business->orders->count();

                return [
                    'id' => $business->id,
                    'name' => $business->name,
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                ];
            });

        return response()->json($businesses);
    }

       public function applications(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'vendor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $applications = BusinessApplication::where('user_id', $user->id)
            ->with(['reviewer:id,name', 'business:id,name'])
            ->orderBy('submitted_at', 'desc')
            ->get();
        
        return response()->json($applications);
    }

    /**
     * Check if vendor can add new business
     */
    public function canAddBusiness(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'vendor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if vendor has any pending applications
        $hasPendingApplication = BusinessApplication::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        return response()->json([
            'can_add_business' => !$hasPendingApplication,
            'message' => $hasPendingApplication 
                ? 'You have a pending business application. Please wait for admin approval before submitting another.'
                : 'You can submit a new business application.'
        ]);
    }
}
