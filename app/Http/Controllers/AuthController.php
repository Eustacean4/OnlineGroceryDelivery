<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
   public function register(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'phone' => 'nullable|string|max:20',
        'password' => 'required|confirmed|min:8',
        'role' => 'required|string|in:admin,customer,vendor,rider'
    ]);

    \Log::info('Incoming registration request:', $request->all());


    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'phone' => $request->phone,
        'password' => Hash::make($request->password),
        'role' => $request->role  // default to customer if not provided
    ]);

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'message' => 'User registered successfully',
        'user' => $user,
        'token' => $token
    ], 201);
}

    public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Incorrect email or password.'
        ], 401);
    }


    // Optional: revoke existing tokens to force single-session login
    // $user->tokens()->delete();

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'message' => 'Login successful',
        'user' => [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role'  => $user->role,
        ],
        'token' => $token
    ]);
}
    public function profile(Request $request)
{
        $user = $request->user();

    if (!$user) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    $user->profile_picture = $user->profile_picture 
        ? asset('storage/' . $user->profile_picture)
        : null;

    return response()->json(['user' => $user]);
}

    public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out successfully'
    ]);
}

     public function updateProfile(Request $request)
{
    $user = $request->user(); // Get the authenticated user

    $request->validate([
        'name' => 'sometimes|required|string|max:255',
        'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
        'current_password' => 'required_with:password',
        'password' => 'sometimes|required|confirmed|min:8',
    ]);

    // If updating password, verify current password
    if ($request->has('password')) {
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }
    }

    // Update user data
    $updateData = [];
    
    if ($request->has('name')) {
        $updateData['name'] = $request->name;
    }
    
    if ($request->has('email')) {
        $updateData['email'] = $request->email;
    }
    
    if ($request->has('password')) {
        $updateData['password'] = Hash::make($request->password);
    }

    $user->update($updateData);

    return response()->json([
        'message' => 'Profile updated successfully',
        'user' => $user->fresh()
    ]);
}
    public function updateUserById(Request $request, $id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    $request->validate([
        'name' => 'sometimes|required|string|max:255',
        'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
        'phone' => 'sometimes|nullable|string|max:20',
        'password' => 'sometimes|required|confirmed|min:8',
    ]);

    $updateData = [];

    if ($request->has('name')) {
        $updateData['name'] = $request->name;
    }

    if ($request->has('email')) {
        $updateData['email'] = $request->email;
    }
    if ($request->has('phone')) {
        $updateData['phone'] = $request->phone;
    }

   if ($request->filled('password')) {
        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }
        $updateData['password'] = Hash::make($request->password);
    }


    $user->update($updateData);

    return response()->json([
        'message' => 'User updated successfully',
        'user' => $user->fresh()
    ]);
}
 
}