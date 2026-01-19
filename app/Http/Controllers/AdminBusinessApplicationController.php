<?php

namespace App\Http\Controllers;

use App\Models\BusinessApplication;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AdminBusinessApplicationController extends Controller
{
    // Remove the problematic constructor entirely
    // The auth:sanctum middleware is already applied in routes/api.php
    
    /**
     * Check if user is admin - helper method
     */
    private function checkAdminAccess()
    {
        if (!auth()->check() || auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return null;
    }

    /**
     * Get all pending applications
     */
    public function pendingApplications()
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $applications = BusinessApplication::pending()
                ->with(['user:id,name,email'])
                ->orderBy('submitted_at', 'desc')
                ->get();
                
            return response()->json($applications);
        } catch (\Exception $e) {
            \Log::error('Error fetching pending applications: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch applications'], 500);
        }
    }

    /**
     * Get all applications with optional status filter
     */
    public function allApplications(Request $request)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $query = BusinessApplication::with(['user:id,name,email', 'reviewer:id,name']);
            
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            $applications = $query->orderBy('submitted_at', 'desc')->get();
            
            \Log::info('Applications fetched successfully', [
                'count' => $applications->count(),
                'user_id' => auth()->id(),
                'user_role' => auth()->user()->role
            ]);
            
            return response()->json($applications);
        } catch (\Exception $e) {
            \Log::error('Error fetching all applications: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch applications'], 500);
        }
    }

    /**
     * Get specific application details
     */
    public function showApplication($id)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $application = BusinessApplication::with(['user:id,name,email,phone', 'reviewer:id,name'])
                ->findOrFail($id);
                
            return response()->json($application);
        } catch (\Exception $e) {
            \Log::error('Error fetching application details: ' . $e->getMessage());
            return response()->json(['message' => 'Application not found'], 404);
        }
    }

    /**
     * Approve application and create business
     */
    public function approveApplication(Request $request, $id)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $application = BusinessApplication::findOrFail($id);
            
            if (!$application->isPending()) {
                return response()->json([
                    'message' => 'Application is not in pending status'
                ], 400);
            }

            // Create the business from the application
            $business = new Business();
            $business->vendor_id = $application->user_id;
            $business->name = $application->name;
            $business->email = $application->email;
            $business->phone = $application->phone;
            $business->address = $application->address;
            $business->logo = $application->logo;
            $business->save();

            // Update application status
            $application->status = 'approved';
            $application->reviewed_at = now();
            $application->reviewed_by = auth()->id();
            $application->business_id = $business->id;
            $application->admin_notes = $request->admin_notes;
            $application->save();
            
            return response()->json([
                'message' => 'Application approved and business created successfully',
                'application' => $application->load('user:id,name,email', 'reviewer:id,name', 'business'),
                'business' => $business
            ]);
        } catch (\Exception $e) {
            \Log::error('Error approving application: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to approve application'], 500);
        }
    }

    /**
     * Reject application
     */
    public function rejectApplication(Request $request, $id)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000',
                'admin_notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $application = BusinessApplication::findOrFail($id);
            
            if (!$application->isPending()) {
                return response()->json([
                    'message' => 'Application is not in pending status'
                ], 400);
            }
            
            $application->status = 'rejected';
            $application->rejection_reason = $request->reason;
            $application->admin_notes = $request->admin_notes;
            $application->reviewed_at = now();
            $application->reviewed_by = auth()->id();
            $application->save();
            
            return response()->json([
                'message' => 'Application rejected successfully',
                'application' => $application->load('user:id,name,email', 'reviewer:id,name')
            ]);
        } catch (\Exception $e) {
            \Log::error('Error rejecting application: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to reject application'], 500);
        }
    }

    /**
     * Get application statistics
     */
    public function getApplicationStats()
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $stats = [
                'total' => BusinessApplication::count(),
                'pending' => BusinessApplication::pending()->count(),
                'approved' => BusinessApplication::approved()->count(),
                'rejected' => BusinessApplication::rejected()->count(),
            ];
            
            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::error('Error fetching application stats: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch statistics'], 500);
        }
    }

    /**
     * Download application document
     */
    public function downloadDocument($applicationId, $documentType)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        $application = BusinessApplication::findOrFail($applicationId);
        
        $validDocuments = [
            'business_license',
            'tax_certificate', 
            'owner_id_document',
            'health_safety_cert',
            'address_proof'
        ];
        
        if (!in_array($documentType, $validDocuments)) {
            return response()->json(['message' => 'Invalid document type'], 400);
        }
        
        $filePath = $application->$documentType;
        
        if (!$filePath || !Storage::disk('public')->exists($filePath)) {
            return response()->json(['message' => 'Document not found'], 404);
        }
        
        return Storage::disk('public')->download($filePath);
    }

    /**
     * View storefront photos
     */
    public function viewStorefrontPhotos($applicationId)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        $application = BusinessApplication::findOrFail($applicationId);
        
        if (!$application->storefront_photos) {
            return response()->json(['message' => 'No storefront photos found'], 404);
        }
        
        $photoUrls = array_map(function($photo) {
            return asset('storage/' . $photo);
        }, $application->storefront_photos);
        
        return response()->json([
            'application_id' => $applicationId,
            'business_name' => $application->name,
            'photos' => $photoUrls
        ]);
    }

    /**
     * Add admin notes to application
     */
    public function addNotes(Request $request, $id)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        $validator = Validator::make($request->all(), [
            'notes' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $application = BusinessApplication::findOrFail($id);
        $application->admin_notes = $request->notes;
        $application->save();

        return response()->json([
            'message' => 'Notes added successfully',
            'application' => $application
        ]);
    }
    public function viewDocument($applicationId, $documentType)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        $application = BusinessApplication::findOrFail($applicationId);
        
        $validDocuments = [
            'business_license',
            'tax_certificate', 
            'owner_id_document',
            'health_safety_cert',
            'address_proof'
        ];
        
        if (!in_array($documentType, $validDocuments)) {
            return response()->json(['message' => 'Invalid document type'], 400);
        }
        
        $filePath = $application->$documentType;
        
        if (!$filePath || !Storage::disk('public')->exists($filePath)) {
            return response()->json(['message' => 'Document not found'], 404);
        }
        
        $fullPath = Storage::disk('public')->path($filePath);
        $mimeType = Storage::disk('public')->mimeType($filePath);
        
        // For images, return them directly for viewing
        if (strpos($mimeType, 'image/') === 0) {
            return response()->file($fullPath);
        }
        
        // For PDFs, allow inline viewing
        if ($mimeType === 'application/pdf') {
            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($filePath) . '"'
            ]);
        }
        
        // For other files, force download
        return Storage::disk('public')->download($filePath);
    }

    /**
     * Get application files info for preview
     */
    public function getApplicationFiles($applicationId)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $application = BusinessApplication::findOrFail($applicationId);
            
            $files = [];
            
            $documentFields = [
                'business_license' => 'Business License',
                'tax_certificate' => 'Tax Certificate',
                'owner_id_document' => 'Owner ID Document',
                'health_safety_cert' => 'Health & Safety Certificate',
                'address_proof' => 'Address Proof'
            ];
            
            foreach ($documentFields as $field => $label) {
                if ($application->$field) {
                    $filePath = $application->$field;
                    
                    if (Storage::disk('public')->exists($filePath)) {
                        $mimeType = Storage::disk('public')->mimeType($filePath);
                        $files[] = [
                            'type' => $field,
                            'label' => $label,
                            'filename' => basename($filePath),
                            'mime_type' => $mimeType,
                            'size' => Storage::disk('public')->size($filePath),
                            'url' => asset('storage/' . $filePath), // Direct URL for viewing
                            'download_url' => route('admin.application.download-document', [
                                'applicationId' => $applicationId,
                                'documentType' => $field
                            ]),
                            'is_image' => strpos($mimeType, 'image/') === 0
                        ];
                    }
                }
            }
            
            // Handle storefront photos with proper download URLs
            if ($application->storefront_photos && is_array($application->storefront_photos)) {
                foreach ($application->storefront_photos as $index => $photo) {
                    if (Storage::disk('public')->exists($photo)) {
                        $mimeType = Storage::disk('public')->mimeType($photo);
                        $files[] = [
                            'type' => 'storefront_photo',
                            'label' => "Storefront Photo " . ($index + 1),
                            'filename' => basename($photo),
                            'mime_type' => $mimeType,
                            'size' => Storage::disk('public')->size($photo),
                            'url' => asset('storage/' . $photo),
                            'download_url' => route('admin.application.download-storefront-photo', [
                                'applicationId' => $applicationId,
                                'photoIndex' => $index
                            ]),
                            'is_image' => true,
                            'photo_index' => $index
                        ];
                    }
                }
            }
            
            return response()->json([
                'application_id' => $applicationId,
                'business_name' => $application->name,
                'files' => $files
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error fetching application files: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch application files'], 500);
        }
    }

    public function downloadStorefrontPhoto($applicationId, $photoIndex)
    {
        // Check admin access
        $adminCheck = $this->checkAdminAccess();
        if ($adminCheck) return $adminCheck;
        
        try {
            $application = BusinessApplication::findOrFail($applicationId);
            
            if (!$application->storefront_photos || !is_array($application->storefront_photos)) {
                return response()->json(['message' => 'No storefront photos found'], 404);
            }
            
            if (!isset($application->storefront_photos[$photoIndex])) {
                return response()->json(['message' => 'Photo not found'], 404);
            }
            
            $photoPath = $application->storefront_photos[$photoIndex];
            
            if (!Storage::disk('public')->exists($photoPath)) {
                return response()->json(['message' => 'Photo file not found'], 404);
            }
            
            return Storage::disk('public')->download($photoPath);
            
        } catch (\Exception $e) {
            \Log::error('Error downloading storefront photo: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to download photo'], 500);
        }
    }
}