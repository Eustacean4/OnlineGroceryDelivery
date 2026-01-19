<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'address',
        'logo',
        'business_license',
        'tax_certificate',
        'owner_id_document',
        'health_safety_cert',
        'address_proof',
        'storefront_photos',
        'status',
        'rejection_reason',
        'admin_notes',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'business_id',
    ];

    protected $casts = [
        'storefront_photos' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    /* -------------------
       Relationships
    ------------------- */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    /* -------------------
       Query Scopes
    ------------------- */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeRecentFirst($query)
    {
        return $query->orderBy('submitted_at', 'desc');
    }

    /* -------------------
       Helper Methods
    ------------------- */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function getSubmittedAtFormattedAttribute()
    {
        return $this->submitted_at?->format('M d, Y H:i');
    }

    public function getReviewedAtFormattedAttribute()
    {
        return $this->reviewed_at?->format('M d, Y H:i');
    }

    public function hasAllRequiredDocuments()
    {
        return !empty($this->business_license)
            && !empty($this->tax_certificate)
            && !empty($this->owner_id_document)
            && !empty($this->address_proof)
            && !empty($this->storefront_photos)
            && count($this->storefront_photos) >= 2;
    }

    public function getDocumentUrl($documentField)
    {
        if (!$this->$documentField) {
            return null;
        }

        return asset('storage/' . $this->$documentField);
    }

    public function getStorefrontPhotoUrls()
    {
        if (!$this->storefront_photos) {
            return [];
        }

        return array_map(function ($photoPath) {
            return asset('storage/' . $photoPath);
        }, $this->storefront_photos);
    }
}
