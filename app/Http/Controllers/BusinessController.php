<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Business;
use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;  
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BusinessController extends Controller
{
    public function store(Request $request)
{
    if (auth()->user()->role !== 'vendor') {
        return response()->json(['message' => 'Only vendors can create businesses.'], 403);
    }

    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email',
        'phone' => 'required|string|max:20',
        'address' => 'required|string|max:255',
        'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    $business = auth()->user()->businesses()->create([
        'name' => $request->name,
        'email' => $request->email,
        'phone' => $request->phone,
        'address' => $request->address,
        'vendor_id' => auth()->id(),
    ]);

    // ✅ Handle logo upload
    if ($request->hasFile('logo')) {
        $logoPath = $request->file('logo')->store('business_logos', 'public');
        $business->logo = $logoPath;
        $business->save();
    }

    return response()->json([
        'message' => 'Business created successfully',
        'business' => $business
    ]);
}


public function show($id)
{
    $business = Business::find($id);

    if (!$business) {
        return response()->json(['message' => 'Business not found'], 404);
    }

    return response()->json($business);
}

public function index()
{
    $user = Auth::user();

    if ($user->role === 'vendor') {
        $businesses = $user->businesses()->withCount('products')->get();
    } elseif ($user->role === 'admin') {
        $businesses = Business::withCount('products')->get(); // Admin sees all
    } else {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    //$businesses = Business::withCount('products')->get();
    return response()->json($businesses);
}

public function indexForCustomer()
{
    $businesses = Business::withCount('products')->get();
    return response()->json($businesses);
}

public function update(Request $request, $id)
{
    $user = auth()->user();

    if (!in_array($user->role, ['vendor', 'admin'])) {
        return response()->json(['message' => 'Unauthorized. Only vendors or admins can update businesses.'], 403);
    }

    $business = Business::find($id);
    if (!$business) {
        return response()->json(['message' => 'Business not found.'], 404);
    }

    if ($user->role === 'vendor' && $business->vendor_id !== $user->id) {
        return response()->json(['message' => 'You can only update your own business.'], 403);
    }

    // Log what we received
    \Log::info('Business update request data:', $request->all());
    \Log::info('Files received:', $request->allFiles());

    $validated = $request->validate([
        'name' => 'sometimes|string|max:255',
        'email' => 'sometimes|email|nullable',
        'phone' => 'sometimes|nullable|string|max:20',
        'address' => 'sometimes|nullable|string',
        'logo' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,gif|max:2048'
    ]);

    \Log::info('Validated data:', $validated);

    // Handle logo upload
    if ($request->hasFile('logo')) {
        \Log::info('Logo file detected, processing upload...');
        
        // Delete old logo if it exists
        if ($business->logo && \Storage::disk('public')->exists($business->logo)) {
            \Log::info('Deleting old logo: ' . $business->logo);
            \Storage::disk('public')->delete($business->logo);
        }
        
        // Store new logo
        $logoPath = $request->file('logo')->store('business_logos', 'public');
        $validated['logo'] = $logoPath;
        
        \Log::info('New logo stored at: ' . $logoPath);
    }

    // Update the business
    $business->update($validated);
    
    \Log::info('Business updated successfully:', $business->toArray());

    // Load fresh data with relationships
    $business->load('vendor');

    return response()->json([
        'message' => 'Business updated successfully.',
        'business' => $business
    ]);
}

public function destroy($id)
{
    $user = auth()->user();

    $business = Business::find($id);
    if (!$business) {
        return response()->json(['message' => 'Business not found.'], 404);
    }

    // ✅ Vendors can only delete their own businesses
    if ($user->role === 'vendor' && $business->vendor_id !== $user->id) {
        return response()->json(['message' => 'You can only delete your own business.'], 403);
    }

    // ✅ Admin can delete any business
    if (!in_array($user->role, ['vendor', 'admin'])) {
        return response()->json(['message' => 'Unauthorized.'], 403);
    }

    if ($business->logo && \Storage::disk('public')->exists($business->logo)) {
        \Storage::disk('public')->delete($business->logo);
    }

    $business->delete();

    return response()->json(['message' => 'Business deleted successfully.']);
}
// In BusinessController
public function myBusinesses()
{
    $user = Auth::user();

    if ($user->role !== 'vendor') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    $businesses = $user->businesses()->select('id', 'name', 'email', 'phone', 'address')->get();

    return response()->json($businesses);
}

 /* Get all customers who have ordered from a specific business
 */
public function getCustomers($businessId)
{
    $user = auth()->user();
    
    // Check if user owns this business (for vendors) or is admin
    if ($user->role === 'vendor') {
        $business = $user->businesses()->find($businessId);
        if (!$business) {
            return response()->json(['message' => 'Unauthorized or business not found'], 403);
        }
    } elseif ($user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Get all unique customers who have ordered from this business
    $customers = User::whereHas('orders', function($query) use ($businessId) {
        $query->where('business_id', $businessId);
    })
    ->withCount(['orders as total_orders' => function($query) use ($businessId) {
        $query->where('business_id', $businessId);
    }])
    ->withSum(['orders as total_spent' => function($query) use ($businessId) {
        $query->where('business_id', $businessId);
    }], 'total')
    ->with(['orders' => function($query) use ($businessId) {
        $query->where('business_id', $businessId)
              ->orderBy('created_at', 'desc')
              ->limit(1);
    }])
    ->get()
    ->map(function($customer) use ($businessId) {
        $firstOrder = $customer->orders()
            ->where('business_id', $businessId)
            ->orderBy('created_at', 'asc')
            ->first();
        
        $lastOrder = $customer->orders()
            ->where('business_id', $businessId)
            ->orderBy('created_at', 'desc')
            ->first();

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'profile_picture' => $customer->profile_picture,
            'total_orders' => $customer->total_orders ?? 0,
            'total_spent' => round($customer->total_spent ?? 0, 2),
            'last_order_date' => $lastOrder ? $lastOrder->created_at->format('Y-m-d') : null,
            'first_order_date' => $firstOrder ? $firstOrder->created_at->format('Y-m-d') : null,
            'days_since_first_order' => $firstOrder ? $firstOrder->created_at->diffInDays(now()) : null,
            'days_since_last_order' => $lastOrder ? $lastOrder->created_at->diffInDays(now()) : null,
        ];
    });

    return response()->json($customers);
}

/**
 * Get customer statistics for a specific business
 */
public function getCustomerStats($businessId)
{
    $user = auth()->user();
    
    // Check if user owns this business (for vendors) or is admin
    if ($user->role === 'vendor') {
        $business = $user->businesses()->find($businessId);
        if (!$business) {
            return response()->json(['message' => 'Unauthorized or business not found'], 403);
        }
    } elseif ($user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Total unique customers
    $totalCustomers = User::whereHas('orders', function($query) use ($businessId) {
        $query->where('business_id', $businessId);
    })->count();

    // New customers this month
    $newThisMonth = User::whereHas('orders', function($query) use ($businessId) {
        $query->where('business_id', $businessId)
              ->where('created_at', '>=', now()->startOfMonth());
    })->count();

    // Average order value
    $averageOrderValue = Order::where('business_id', $businessId)
        ->avg('total') ?? 0;

    // Top spending customer
    $topSpender = User::whereHas('orders', function($query) use ($businessId) {
        $query->where('business_id', $businessId);
    })
    ->withSum(['orders as total_spent' => function($query) use ($businessId) {
        $query->where('business_id', $businessId);
    }], 'total')
    ->orderBy('total_spent', 'desc')
    ->first();

    return response()->json([
        'totalCustomers' => $totalCustomers,
        'newThisMonth' => $newThisMonth,
        'averageOrderValue' => round($averageOrderValue, 2),
        'topSpender' => $topSpender ? [
            'id' => $topSpender->id,
            'name' => $topSpender->name,
            'total_spent' => round($topSpender->total_spent, 2)
        ] : null
    ]);
}

}
