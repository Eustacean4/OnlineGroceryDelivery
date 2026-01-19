<?php
// app/Models/PaymentMethod.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'card_type',
        'card_number',
        'card_holder_name',
        'expiry_month',
        'expiry_year',
        'cvv',
        'is_default',
        'display_name'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    protected $hidden = [
        'cvv',
        'card_number'
    ];

    /**
     * Relationship with User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Encrypt card number when saving
     */
    public function setCardNumberAttribute($value)
    {
        $this->attributes['card_number'] = Crypt::encrypt($value);
    }

    /**
     * Decrypt card number when retrieving
     */
    public function getCardNumberAttribute($value)
    {
        try {
            return Crypt::decrypt($value);
        } catch (\Exception $e) {
            return $value; // Fallback for unencrypted data
        }
    }

    /**
     * Encrypt CVV when saving
     */
    public function setCvvAttribute($value)
    {
        $this->attributes['cvv'] = Crypt::encrypt($value);
    }

    /**
     * Decrypt CVV when retrieving
     */
    public function getCvvAttribute($value)
    {
        try {
            return Crypt::decrypt($value);
        } catch (\Exception $e) {
            return $value; // Fallback for unencrypted data
        }
    }

    /**
     * Get masked card number for display
     */
    public function getMaskedCardNumberAttribute()
    {
        $cardNumber = $this->card_number;
        if (strlen($cardNumber) < 4) {
            return str_repeat('*', strlen($cardNumber));
        }
        return str_repeat('*', strlen($cardNumber) - 4) . substr($cardNumber, -4);
    }

    /**
     * Get display name attribute
     */
    public function getDisplayNameAttribute($value)
    {
        if ($value) {
            return $value;
        }
        
        $type = ucfirst($this->card_type);
        $lastFour = substr($this->card_number, -4);
        return "{$type} ending in {$lastFour}";
    }
}