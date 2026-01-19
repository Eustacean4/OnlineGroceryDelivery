<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RiderController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\BusinessApplicationController;
use App\Http\Controllers\AdminBusinessApplicationController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\PaymentMethodsController;
use App\Http\Controllers\API\SupportTicketController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'reset']);

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('public/businesses', [BusinessController::class, 'indexForCustomer']); // public
Route::get('/products', [ProductController::class, 'index']);
// Add this with your other public routes:
Route::get('/businesses/{id}/products', [ProductController::class, 'getBusinessProducts']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Admin analytics/metrics
    Route::get('/admin/metrics', [AdminController::class, 'getMetrics']);
    
    // Admin business application routes - MOVED ABOVE other admin routes
    Route::prefix('admin/applications')->group(function () {
        Route::get('/pending', [AdminBusinessApplicationController::class, 'pendingApplications']);
        Route::get('/all', [AdminBusinessApplicationController::class, 'allApplications']);
        Route::get('/stats', [AdminBusinessApplicationController::class, 'getApplicationStats']);
        Route::get('/{id}', [AdminBusinessApplicationController::class, 'showApplication']);
        Route::post('/{id}/approve', [AdminBusinessApplicationController::class, 'approveApplication']);
        Route::post('/{id}/reject', [AdminBusinessApplicationController::class, 'rejectApplication']);
        Route::post('/{id}/notes', [AdminBusinessApplicationController::class, 'addNotes']);
         Route::get('/{applicationId}/download/{documentType}', [AdminBusinessApplicationController::class, 'downloadDocument'])
            ->name('admin.application.download-document');
        Route::get('/{id}/storefront-photos', [AdminBusinessApplicationController::class, 'viewStorefrontPhotos']);
        // Add this line inside your Route::prefix('admin/applications')->group(function () {
        Route::get('/{applicationId}/download-storefront/{photoIndex}', [AdminBusinessApplicationController::class, 'downloadStorefrontPhoto'])
            ->name('admin.application.download-storefront-photo');
            
         // NEW: File viewing routes
        Route::get('/{id}/files', [AdminBusinessApplicationController::class, 'getApplicationFiles']);
        Route::get('/{applicationId}/view/{documentType}', [AdminBusinessApplicationController::class, 'viewDocument'])
            ->name('admin.application.view-document');
    });

    // Business Application Routes (for vendors)
    Route::prefix('business-applications')->group(function () {
        Route::post('/', [BusinessApplicationController::class, 'store']);
        Route::get('/', [BusinessApplicationController::class, 'index']);
        Route::get('/{id}', [BusinessApplicationController::class, 'show']);
        Route::put('/{id}', [BusinessApplicationController::class, 'update']);
        Route::delete('/{id}', [BusinessApplicationController::class, 'destroy']);
        // In your business application routes group
        Route::post('/{id}/resubmit', [BusinessApplicationController::class, 'resubmit']);
    });
    
    // Auth controller routes
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/users/{id}', [AuthController::class, 'updateUserById']);

    // User controller routes
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']); 
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Support Ticket Routes - User routes
    Route::prefix('user')->group(function () {
        Route::get('/tickets', [SupportTicketController::class, 'index']);
        Route::post('/tickets', [SupportTicketController::class, 'store']);
        Route::get('/tickets/{id}', [SupportTicketController::class, 'show']);
    });

    // Support Ticket Routes - Vendor routes (NEW)
    Route::prefix('vendor')->group(function () {
        Route::get('/tickets', [SupportTicketController::class, 'vendorIndex']);
        Route::post('/tickets', [SupportTicketController::class, 'vendorStore']);
        Route::get('/tickets/{id}', [SupportTicketController::class, 'vendorShow']);
    });

    // Support Ticket Routes - Admin routes (FIXED)
    Route::prefix('admin')->group(function () {
        Route::get('/tickets', [SupportTicketController::class, 'getAllTickets']);
        Route::get('/tickets/{id}', [SupportTicketController::class, 'show']); // Added this line
        Route::post('/tickets/{id}/respond', [SupportTicketController::class, 'respondToTicket']);
        Route::put('/tickets/{id}/status', [SupportTicketController::class, 'updateStatus']); // Fixed this line
    });

    // Product controller routes
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Business controller routes
    Route::post('/businesses', [BusinessController::class, 'store']);
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::get('/businesses/{id}', [BusinessController::class, 'show']);
    Route::put('/businesses/{id}', [BusinessController::class, 'update']);
    Route::delete('/businesses/{id}', [BusinessController::class, 'destroy']);
    Route::delete('/businesses/{id}/remove-logo', [BusinessController::class, 'removeLogo']);
    // Add this inside your Route::middleware(...) group
    Route::get('/vendor/businesses', [BusinessController::class, 'indexForVendor']);
    
    // Admin route for business products
    Route::get('/admin/businesses/{id}/products', [AdminController::class, 'getBusinessProducts']);

    // Categories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('orders/{order}/assign-rider', [OrderController::class, 'assignRider']);
    Route::get('/orders', [OrderController::class, 'index']); 
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    Route::get('/businesses/{id}/orders', [OrderController::class, 'getBusinessOrders']);
    Route::put('/orders/{orderId}/status', [OrderController::class, 'updateStatus']);

    // Addresses
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::get('/addresses/{id}', [AddressController::class, 'userAddresses']);
    Route::post('/addresses', [AddressController::class, 'store']);

    // Payment Methods
    Route::get('/payment-methods', [PaymentMethodsController::class, 'index']);
    Route::post('/payment-methods', [PaymentMethodsController::class, 'store']);
    Route::delete('/payment-methods/{id}', [PaymentMethodsController::class, 'destroy']);
    Route::patch('/payment-methods/{id}/default', [PaymentMethodsController::class, 'setDefault']);
    // Payments
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);

    // Rider routes
    Route::get('/rider/orders', [RiderController::class, 'assignedOrders']);
    Route::put('/rider/orders/{orderId}/update-status', [RiderController::class, 'updateDeliveryStatus']);

    // Wishlist routes
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product_id}', [WishlistController::class, 'destroy']);
    
    // Vendor routes
    Route::get('/vendor/businesses', [VendorController::class, 'businesses']);
    Route::get('/vendor/dashboard-summary', [VendorController::class, 'dashboardSummary']);

    Route::get('/notifications', function (Request $request) {
        return $request->user()->notifications;
    });

    // Profile routes
    Route::post('/profile/upload-picture', [ProfileController::class, 'uploadProfilePicture']);
    Route::delete('/profile/remove-picture', [ProfileController::class, 'removeProfilePicture']);

    // Customer management routes (add inside Route::middleware('auth:sanctum')->group)
    Route::get('/businesses/{id}/customers', [BusinessController::class, 'getCustomers']);
    Route::get('/businesses/{id}/customer-stats', [BusinessController::class, 'getCustomerStats']);
    
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);

    Route::post('/create-payment-intent', [PaymentController::class, 'createPaymentIntent']);
});