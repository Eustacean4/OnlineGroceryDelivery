<?php
namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    public function index()
    {
        try {
            $wishlist = Wishlist::with('product')
                ->where('user_id', Auth::id())
                ->get();
            
            return response()->json($wishlist);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch wishlist'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
            ]);

            // Check if already in wishlist
            $existingItem = Wishlist::where('user_id', Auth::id())
                ->where('product_id', $request->product_id)
                ->first();

            if ($existingItem) {
                return response()->json(['message' => 'Item already in wishlist'], 409);
            }

            $wishlist = Wishlist::create([
                'user_id' => Auth::id(),
                'product_id' => $request->product_id,
            ]);

            // Load the product relationship
            $wishlist->load('product');

            return response()->json([
                'message' => 'Added to wishlist successfully',
                'wishlist_item' => $wishlist
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to add to wishlist'], 500);
        }
    }

    public function destroy($product_id)
    {
        try {
            $deleted = Wishlist::where('user_id', Auth::id())
                ->where('product_id', $product_id)
                ->delete();

            if ($deleted) {
                return response()->json(['message' => 'Removed from wishlist']);
            } else {
                return response()->json(['message' => 'Item not found in wishlist'], 404);
            }

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to remove from wishlist'], 500);
        }
    }
}