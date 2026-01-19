<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    // ✅ Update address
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $address = Address::findOrFail($id);

        if (!in_array($user->role, ['admin', 'customer'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'customer' && $address->user_id !== $user->id) {
            return response()->json(['message' => 'You do not own this address'], 403);
        }

        $request->validate([
            'street' => 'sometimes|string',
            'city' => 'sometimes|string',
            'state' => 'sometimes|string',
            'postal_code' => 'sometimes|string',
            'country' => 'sometimes|string',
            'building_name' => 'sometimes|string|nullable',
            'door_number' => 'sometimes|string|nullable',
            'latitude' => 'sometimes|numeric|nullable',
            'longitude' => 'sometimes|numeric|nullable',
        ]);

        $address->update($request->all());

        return response()->json(['message' => 'Address updated', 'address' => $address]);
    }

    // ✅ Delete address
    public function destroy($id)
    {
        $user = Auth::user();
        $address = Address::findOrFail($id);

        if (!in_array($user->role, ['admin', 'customer'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'customer' && $address->user_id !== $user->id) {
            return response()->json(['message' => 'You do not own this address'], 403);
        }

        $address->delete();

        return response()->json(['message' => 'Address deleted']);
    }
    // ✅ Customer views their own addresses
    public function index()
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'customer'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $addresses = $user->addresses;

        return response()->json($addresses);
    }

    // ✅ Admin views addresses for any user
    public function userAddresses($userId)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $addresses = \App\Models\Address::where('user_id', $userId)->get();

        return response()->json($addresses);
    }
    public function store(Request $request)
    {
        $request->validate([
            'label' => 'nullable|string|max:50',
            'street' => 'required|string|max:255',
            'building_name' => 'nullable|string|max:255',
            'door_number' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $address = $request->user()->addresses()->create([
            'label' => $request->label ?: 'home',
            'street' => $request->street,
            'building_name' => $request->building_name,
            'door_number' => $request->door_number,
            'city' => $request->city,
            'state' => $request->state,
            'postal_code' => $request->postal_code ?: 'N/A', 
            'country' => $request->country,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json($address, 201);
    }


}
