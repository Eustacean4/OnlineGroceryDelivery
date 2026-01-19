<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'price', 'stock', 'image', 'category_id','business_id'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
    public function business()
    {
        return $this->belongsTo(Business::class);
    }
    public function getImageUrlAttribute()
    {
        return asset('storage/' . $this->image_path); // Assuming `image_path` is your DB column
    }


}