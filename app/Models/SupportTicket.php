<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'admin_id',
        'subject',
        'description',
        'type',
        'priority',
        'status',
        'admin_response',
        'responded_at',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationship with User who created the ticket
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relationship with Admin who responded (optional)
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    // Scope for filtering by status
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope for filtering by type
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Scope for filtering by priority
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }
}