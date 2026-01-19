<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    // View all products (public)
    public function index()
    {
        return Product::with('category', 'business')->get();
    }

    // View one product by ID (public)
    public function show($id)
    {
        return Product::with('category', 'business')->findOrFail($id);
    }

    // Create product (vendor/admin only)
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'vendor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'category_name' => 'required|string',
            'business_id' => 'required|exists:businesses,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Check vendor owns the business
        if ($user->role === 'vendor' && !$user->businesses()->where('id', $request->business_id)->exists()) {
            return response()->json(['message' => 'You do not own this business'], 403);
        }

        // Find category by name
        $category = Category::where('name', $request->category_name)->first();
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('product_images', 'public');
        }

        // Create product
        $product = Product::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'category_id' => $category->id,
            'business_id' => $request->business_id,
            'image' => $imagePath,
        ]);

        return response()->json(['message' => 'Product created', 'product' => $product], 201);
    }


 
// ProductController.php - Fixed update method

    public function update(Request $request, $id)
{
    $user = Auth::user();
    $product = Product::findOrFail($id);

    // Check authorization
    if ($user->role === 'vendor' && !$user->businesses()->where('id', $product->business_id)->exists()) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    if (!in_array($user->role, ['admin', 'vendor'])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Log what we received
    \Log::info('Product update request data:', $request->all());
    \Log::info('Files received:', $request->allFiles());
    \Log::info('Updating product ID: ' . $id);

    // Validation
    $validated = $request->validate([
        'name' => 'sometimes|string|max:255',
        'description' => 'sometimes|nullable|string',
        'price' => 'sometimes|numeric|min:0',
        'stock' => 'sometimes|integer|min:0',
        'category_name' => 'sometimes|string',
        'business_id' => 'sometimes|exists:businesses,id',
        'image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    \Log::info('Validated data:', $validated);

    // Handle category by name
    if (isset($validated['category_name'])) {
        $category = Category::where('name', $validated['category_name'])->first();
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }
        $validated['category_id'] = $category->id;
        unset($validated['category_name']); // Remove this from update data
        
        \Log::info('Found category ID: ' . $category->id . ' for name: ' . $request->category_name);
    }

    // Handle image upload
    if ($request->hasFile('image')) {
        \Log::info('Image file detected, processing upload...');
        
        // Delete old image if exists
        if ($product->image && Storage::disk('public')->exists($product->image)) {
            \Log::info('Deleting old image: ' . $product->image);
            Storage::disk('public')->delete($product->image);
        }
        
        // Store new image
        $imagePath = $request->file('image')->store('product_images', 'public');
        $validated['image'] = $imagePath;
        
        \Log::info('New image stored at: ' . $imagePath);
    }

    // Update the product
    $product->update($validated);
    
    \Log::info('Product updated successfully');

    // Return updated product with relationships
    $product->load('category', 'business');

    return response()->json([
        'message' => 'Product updated successfully',
        'product' => $product
    ]);
}


    // Delete product
    public function destroy($id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if (
            $user->role === 'vendor' &&
            !$user->businesses()->where('id', $product->business_id)->exists()
        ) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
    // In ProductController.php
    public function getBusinessProducts($id)
{
    $business = Business::with('products')->find($id);

    if (!$business) {
        return response()->json(['message' => 'Business not found'], 404);
    }

    return response()->json([
        'products' => $business->products
    ]);
}

}
