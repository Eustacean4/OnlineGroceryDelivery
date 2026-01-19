<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SupportTicketController extends Controller
{
    // Get user's tickets
    public function index()
    {
        try {
            $tickets = SupportTicket::where('user_id', Auth::id())
                ->with('admin')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($tickets);
        } catch (\Exception $e) {
            Log::error('Failed to fetch tickets: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch tickets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Create new ticket
    public function store(Request $request)
    {
        // Log the incoming request for debugging
        Log::info('Creating support ticket', [
            'user_id' => Auth::id(),
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:general,payment,delivery,account,technical,complaint,refund',
            'priority' => 'required|in:low,medium,high',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $ticket = SupportTicket::create([
                'user_id' => Auth::id(),
                'subject' => $request->subject,
                'description' => $request->description,
                'type' => $request->type,
                'priority' => $request->priority,
                'status' => 'open',
            ]);

            // Load relationships after creation
            $ticket->load('user');
            
            // Try to load admin relationship if it exists, otherwise ignore
            try {
                $ticket->load('admin');
            } catch (\Exception $e) {
                // Admin relationship might not exist, that's okay
                Log::info('Admin relationship not loaded: ' . $e->getMessage());
            }

            Log::info('Support ticket created successfully', ['ticket_id' => $ticket->id]);

            return response()->json($ticket, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create ticket: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Failed to create ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get specific ticket
    public function show($id)
    {
        try {
            $ticket = SupportTicket::where('user_id', Auth::id())
                ->where('id', $id)
                ->with(['user'])
                ->firstOrFail();

            // Try to load admin relationship if it exists
            try {
                $ticket->load('admin');
            } catch (\Exception $e) {
                // Admin relationship might not exist, that's okay
                Log::info('Admin relationship not loaded for ticket show: ' . $e->getMessage());
            }

            return response()->json($ticket);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ticket not found'
            ], 404);
        }
    }

    // VENDOR METHODS (NEW)
    
    // Get vendor's tickets
    public function vendorIndex()
    {
        try {
            $user = Auth::user();
            
            // Check if user is a vendor (has role 'vendor' or owns businesses)
            if ($user->role !== 'vendor' && $user->role !== 'business_owner') {
                return response()->json(['message' => 'Unauthorized - Vendor access required'], 403);
            }

            $tickets = SupportTicket::where('user_id', $user->id)
                ->with('admin')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($tickets);
        } catch (\Exception $e) {
            Log::error('Failed to fetch vendor tickets: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch tickets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Create new vendor ticket
    public function vendorStore(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is a vendor
        if ($user->role !== 'vendor' && $user->role !== 'business_owner') {
            return response()->json(['message' => 'Unauthorized - Vendor access required'], 403);
        }

        // Log the incoming request for debugging
        Log::info('Creating vendor support ticket', [
            'user_id' => $user->id,
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:general,payment,delivery,account,technical,product,commission',
            'priority' => 'required|in:low,medium,high',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'subject' => $request->subject,
                'description' => $request->description,
                'type' => $request->type,
                'priority' => $request->priority,
                'status' => 'open',
                'user_type' => 'vendor', // Mark as vendor ticket
            ]);

            // Load relationships after creation
            $ticket->load('user');
            
            // Try to load admin relationship if it exists
            try {
                $ticket->load('admin');
            } catch (\Exception $e) {
                Log::info('Admin relationship not loaded: ' . $e->getMessage());
            }

            Log::info('Vendor support ticket created successfully', ['ticket_id' => $ticket->id]);

            return response()->json($ticket, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create vendor ticket: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Failed to create ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get specific vendor ticket
    public function vendorShow($id)
    {
        try {
            $user = Auth::user();
            
            // Check if user is a vendor
            if ($user->role !== 'vendor' && $user->role !== 'business_owner') {
                return response()->json(['message' => 'Unauthorized - Vendor access required'], 403);
            }

            $ticket = SupportTicket::where('user_id', $user->id)
                ->where('id', $id)
                ->with(['user'])
                ->firstOrFail();

            // Try to load admin relationship if it exists
            try {
                $ticket->load('admin');
            } catch (\Exception $e) {
                Log::info('Admin relationship not loaded for vendor ticket show: ' . $e->getMessage());
            }

            return response()->json($ticket);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ticket not found'
            ], 404);
        }
    }

    // Admin methods
    public function getAllTickets(Request $request)
    {
        $user = $request->user();
        
        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tickets = SupportTicket::with(['user', 'admin'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    public function respondToTicket(Request $request, $id)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'response' => 'required|string',
            'status' => 'string|in:open,in_progress,resolved,closed'
        ]);

        $ticket = SupportTicket::findOrFail($id);
        
        $ticket->update([
            'admin_response' => $request->response,
            'admin_id' => $user->id,
            'status' => $request->status ?? 'resolved',
            'responded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Response sent successfully',
            'ticket' => $ticket->load(['user', 'admin'])
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|string|in:open,in_progress,resolved,closed'
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $ticket->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Status updated successfully',
            'ticket' => $ticket->load(['user', 'admin'])
        ]);
    }
}