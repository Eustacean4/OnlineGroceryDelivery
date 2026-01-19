<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;  // import User model

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'vendor_id',
        'logo',
    ];

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }
    public function index()
    {
        $businesses = \App\Models\Business::all();
        return response()->json($businesses);
    }

    public function show($id)
    {
        $business = \App\Models\Business::find($id);

        if (!$business) {
            return response()->json(['message' => 'Business not found.'], 404);
        }

        return response()->json($business);
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'business_id');
    }
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

}
