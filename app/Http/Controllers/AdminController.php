<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // GET /api/admin/orders - Get all orders with details
    public function getOrders()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orders = Order::with([
            'user:id,name,email', 
            'items.product:id,name,price', 
            'address:id,street,city,state,postal_code',
            'rider:id,name,phone'
        ])
        ->select('id', 'user_id', 'address_id', 'rider_id', 'total', 'status', 'created_at', 'updated_at')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($order) {
            // Format the data to match your React component expectations
            $itemsText = $order->items->map(function ($item) {
                return $item->product->name . ' x' . $item->quantity;
            })->implode(', ');

            return [
                'id' => $order->id,
                'customer' => $order->user->name ?? 'Unknown',
                'items' => $itemsText,
                'total' => $order->total,
                'status' => $order->status,
                'rider' => $order->rider->name ?? null,
                'address' => $order->address ? 
                    $order->address->street . ', ' . $order->address->city : 'No address',
                'createdAt' => $order->created_at->toISOString(),
                'deliveredAt' => $order->status === 'delivered' ? $order->updated_at->toISOString() : null,
            ];
        });

        return response()->json($orders);
    }

    // GET /api/admin/riders - Get all riders with their details
    public function getRiders()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $riders = User::where('role', 'rider')
            ->withCount(['assignedOrders as currentOrders' => function ($query) {
                $query->whereIn('status', ['pending', 'shipped']);
            }])
            ->withCount(['assignedOrders as totalDeliveries' => function ($query) {
                $query->where('status', 'delivered');
            }])
            ->get()
            ->map(function ($rider) {
                return [
                    'id' => $rider->id,
                    'name' => $rider->name,
                    'phone' => $rider->phone ?? 'N/A',
                    'status' => $rider->currentOrders > 0 ? 'busy' : 'available',
                    'currentOrders' => $rider->currentOrders,
                    'totalDeliveries' => $rider->totalDeliveries,
                    'rating' => 4.5, // You can calculate this from reviews if you have them
                    'location' => [
                        'lat' => 0, // Add actual coordinates if you store them
                        'lng' => 0
                    ]
                ];
            });

        return response()->json($riders);
    }

    // GET /api/admin/metrics - Get dashboard metrics
    public function getMetrics()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Calculate metrics
        $totalOrders = Order::count();
        $totalRevenue = Order::where('status', 'delivered')->sum('total');
        $activeRiders = User::where('role', 'rider')
            ->whereHas('assignedOrders', function ($query) {
                $query->whereIn('status', ['pending', 'shipped']);
            })
            ->count();

        // Average delivery time (in minutes)
        $avgDeliveryTime = Order::where('status', 'delivered')
            ->whereNotNull('updated_at')
            ->get()
            ->map(function ($order) {
                return $order->created_at->diffInMinutes($order->updated_at);
            })
            ->avg();

        // Top selling products (by quantity)
        $topProducts = \App\Models\Order::join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.id', 'products.name', \DB::raw('SUM(order_items.quantity) as total_sold'))
            ->where('orders.status', 'delivered')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // Revenue by business
        $revenueByBusiness = \App\Models\Order::join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('businesses', 'products.business_id', '=', 'businesses.id')
            ->select('businesses.id', 'businesses.name', \DB::raw('SUM(order_items.quantity * order_items.price) as revenue'))
            ->where('orders.status', 'delivered')
            ->groupBy('businesses.id', 'businesses.name')
            ->orderByDesc('revenue')
            ->get();

        // Customer growth (new users per month for last 6 months)
        $customerGrowth = \App\Models\User::where('role', 'customer')
            ->select(\DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'), \DB::raw('COUNT(*) as count'))
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(6)
            ->get();

        // Rider performance (deliveries per rider, avg delivery time per rider)
        $riderPerformance = \App\Models\User::where('role', 'rider')
            ->withCount(['assignedOrders as deliveries' => function ($query) {
                $query->where('status', 'delivered');
            }])
            ->get()
            ->map(function ($rider) {
                // Average delivery time for this rider
                $avgTime = \App\Models\Order::where('rider_id', $rider->id)
                    ->where('status', 'delivered')
                    ->whereNotNull('updated_at')
                    ->get()
                    ->map(function ($order) {
                        return $order->created_at->diffInMinutes($order->updated_at);
                    })
                    ->avg();
                return [
                    'id' => $rider->id,
                    'name' => $rider->name,
                    'deliveries' => $rider->deliveries,
                    'avgDeliveryTime' => round($avgTime ?? 0, 0)
                ];
            });

        // Cancelled and failed orders
        $cancelledOrders = Order::where('status', 'cancelled')->count();
        $failedOrders = Order::where('status', 'failed')->count();

        $metrics = [
            'totalOrders' => $totalOrders,
            'totalRevenue' => round($totalRevenue, 2),
            'activeRiders' => $activeRiders,
            'avgDeliveryTime' => round($avgDeliveryTime ?? 0, 0),
            'topProducts' => $topProducts,
            'revenueByBusiness' => $revenueByBusiness,
            'customerGrowth' => $customerGrowth,
            'riderPerformance' => $riderPerformance,
            'cancelledOrders' => $cancelledOrders,
            'failedOrders' => $failedOrders
        ];

        return response()->json($metrics);
    }

    // GET /api/admin/dashboard - Get all dashboard data in one call (optional)
    public function getDashboard()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'orders' => $this->getOrders()->getData(),
            'riders' => $this->getRiders()->getData(),
            'metrics' => $this->getMetrics()->getData(),
        ]);
    }

    // GET /api/businesses/{id}/products - Get all products for a business
    public function getBusinessProducts($id)
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $business = \App\Models\Business::with(['products.category'])->find($id);
        if (!$business) {
            return response()->json(['message' => 'Business not found.'], 404);
        }

        $products = $business->products->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
                'price' => $product->price,
                'stock' => $product->stock ?? $product->quantity ?? null,
                'description' => $product->description ?? '',
                // Add more fields as needed
            ];
        });

        return response()->json($products);
    }
}