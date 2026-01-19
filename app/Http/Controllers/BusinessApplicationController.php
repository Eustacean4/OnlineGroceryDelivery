<?php

namespace App\Http\Controllers;

use App\Models\BusinessApplication;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BusinessApplicationController extends Controller
{
    /**
     * Submit a new business application
     */
    public function store(Request $request)
    {
        // Enhanced debugging
        $debugInfo = [
            'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
            'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
            'POST_DATA' => $_POST,
            'FILES_DATA' => $_FILES,
            'REQUEST_ALL' => $request->all(),
            'HAS_FILES' => [
                'logo' => $request->hasFile('logo'),
                'business_license' => $request->hasFile('business_license'),
                'tax_certificate' => $request->hasFile('tax_certificate'),
                'owner_id_document' => $request->hasFile('owner_id_document'),
                'health_safety_cert' => $request->hasFile('health_safety_cert'),
                'address_proof' => $request->hasFile('address_proof'),
                'storefront_photos' => $request->hasFile('storefront_photos'),
            ]
        ];
        
        file_put_contents(storage_path('logs/detailed_debug.log'), print_r($debugInfo, true));

        if (auth()->user()->role !== 'vendor') {
            return response()->json(['message' => 'Only vendors can submit business applications.'], 403);
        }

        // Custom validation for storefront photos
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:business_applications,email',
            'phone' => 'required|string',
            'address' => 'required|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            
            // Required documents
            'business_license' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tax_certificate' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'owner_id_document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'health_safety_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_proof' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Add custom validation for storefront photos
        $validator->after(function ($validator) use ($request) {
            // Log what we're checking
            $debugValidation = [
                'hasFile' => $request->hasFile('storefront_photos'),
                'files' => $request->hasFile('storefront_photos') ? count($request->file('storefront_photos')) : 0
            ];
            file_put_contents(storage_path('logs/validation_debug.log'), print_r($debugValidation, true));

            if (!$request->hasFile('storefront_photos')) {
                $validator->errors()->add('storefront_photos', 'Storefront photos are required');
                return;
            }

            $photos = $request->file('storefront_photos');
            
            // Check if it's an array and has the right number of files
            if (!is_array($photos)) {
                $validator->errors()->add('storefront_photos', 'Storefront photos must be an array of files');
                return;
            }

            $photoCount = count($photos);
            if ($photoCount < 2) {
                $validator->errors()->add('storefront_photos', 'At least 2 storefront photos are required');
                return;
            }

            if ($photoCount > 5) {
                $validator->errors()->add('storefront_photos', 'Maximum 5 storefront photos allowed');
                return;
            }

            // Validate each photo
            foreach ($photos as $index => $photo) {
                if (!$photo || !$photo->isValid()) {
                    $validator->errors()->add("storefront_photos.{$index}", 'Invalid file upload');
                    continue;
                }

                // Check if it's actually a file
                if (!is_object($photo) || !method_exists($photo, 'getClientOriginalExtension')) {
                    $validator->errors()->add("storefront_photos.{$index}", 'Invalid file object');
                    continue;
                }

                $extension = strtolower($photo->getClientOriginalExtension());
                if (!in_array($extension, ['jpg', 'jpeg', 'png'])) {
                    $validator->errors()->add("storefront_photos.{$index}", 'File must be jpg, jpeg, or png');
                }

                if ($photo->getSize() > 3072 * 1024) { // 3MB in bytes
                    $validator->errors()->add("storefront_photos.{$index}", 'File size must not exceed 3MB');
                }
            }
        });

        if ($validator->fails()) {
            // Enhanced error logging
            $errors = $validator->errors()->toArray();
            file_put_contents(storage_path('logs/validation_errors.log'), print_r($errors, true));
            
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $errors,
                'debug_info' => [
                    'has_storefront_photos' => $request->hasFile('storefront_photos'),
                    'storefront_photos_count' => $request->hasFile('storefront_photos') ? count($request->file('storefront_photos')) : 0
                ]
            ], 422);
        }

        $application = new BusinessApplication();
        $application->user_id = auth()->id();
        $application->name = $request->name;
        $application->email = $request->email;
        $application->phone = $request->phone;
        $application->address = $request->address;
        $application->status = 'pending';
        $application->submitted_at = now();

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $application->logo = $request->file('logo')->store('business_logos', 'public');
        }

        // Handle document uploads
        $application->business_license = $request->file('business_license')->store('business_documents', 'public');
        $application->tax_certificate = $request->file('tax_certificate')->store('business_documents', 'public');
        $application->owner_id_document = $request->file('owner_id_document')->store('business_documents', 'public');
        $application->address_proof = $request->file('address_proof')->store('business_documents', 'public');

        if ($request->hasFile('health_safety_cert')) {
            $application->health_safety_cert = $request->file('health_safety_cert')->store('business_documents', 'public');
        }

        // Handle multiple storefront photos
        $photos = [];
        foreach ($request->file('storefront_photos') as $photo) {
            $photos[] = $photo->store('storefront_photos', 'public');
        }
        $application->storefront_photos = $photos;

        $application->save();

        return response()->json([
            'message' => 'Business application submitted successfully. It will be reviewed by an administrator.',
            'application' => $application
        ], 201);
    }

    /**
     * Get user's business applications
     */
    public function index(Request $request)
    {
        $applications = BusinessApplication::where('user_id', auth()->id())
            ->with('reviewer:id,name')
            ->orderBy('submitted_at', 'desc')
            ->get();

        return response()->json($applications);
    }

    /**
     * Get specific application details
     */
    public function show($id)
    {
        $application = BusinessApplication::where('user_id', auth()->id())
            ->with(['reviewer:id,name', 'business:id,name'])
            ->findOrFail($id);

        return response()->json($application);
    }

    /**
     * Update pending application
     */
    public function update(Request $request, $id)
    {
        $application = BusinessApplication::where('user_id', auth()->id())->findOrFail($id);

        if (!$application->isPending()) {
            return response()->json([
                'message' => 'Cannot update application that has already been reviewed'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:business_applications,email,' . $id,
            'phone' => 'sometimes|string',
            'address' => 'sometimes|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            
            'business_license' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tax_certificate' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'owner_id_document' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'health_safety_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_proof' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Add custom validation for storefront photos if they're being updated
        $validator->after(function ($validator) use ($request) {
            if ($request->hasFile('storefront_photos')) {
                $photos = $request->file('storefront_photos');
                
                if (!is_array($photos) || count($photos) < 2 || count($photos) > 5) {
                    $validator->errors()->add('storefront_photos', 'You must upload between 2 and 5 storefront photos');
                    return;
                }

                foreach ($photos as $index => $photo) {
                    if (!$photo->isValid()) {
                        $validator->errors()->add("storefront_photos.{$index}", 'Invalid file upload');
                        continue;
                    }

                    $extension = $photo->getClientOriginalExtension();
                    if (!in_array(strtolower($extension), ['jpg', 'jpeg', 'png'])) {
                        $validator->errors()->add("storefront_photos.{$index}", 'File must be jpg, jpeg, or png');
                    }

                    if ($photo->getSize() > 3072 * 1024) {
                        $validator->errors()->add("storefront_photos.{$index}", 'File size must not exceed 3MB');
                    }
                }
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update basic fields
        $application->fill($request->only(['name', 'email', 'phone', 'address']));

        // Handle file uploads
        if ($request->hasFile('logo')) {
            if ($application->logo) {
                Storage::disk('public')->delete($application->logo);
            }
            $application->logo = $request->file('logo')->store('business_logos', 'public');
        }

        // Update documents
        $documentFields = ['business_license', 'tax_certificate', 'owner_id_document', 'health_safety_cert', 'address_proof'];
        
        foreach ($documentFields as $field) {
            if ($request->hasFile($field)) {
                if ($application->$field) {
                    Storage::disk('public')->delete($application->$field);
                }
                $application->$field = $request->file($field)->store('business_documents', 'public');
            }
        }

        // Handle storefront photos
        if ($request->hasFile('storefront_photos')) {
            if ($application->storefront_photos) {
                foreach ($application->storefront_photos as $photo) {
                    Storage::disk('public')->delete($photo);
                }
            }
            
            $photos = [];
            foreach ($request->file('storefront_photos') as $photo) {
                $photos[] = $photo->store('storefront_photos', 'public');
            }
            $application->storefront_photos = $photos;
        }

        $application->save();

        return response()->json([
            'message' => 'Application updated successfully',
            'application' => $application
        ]);
    }

    /**
     * Delete pending application
     */
    public function destroy($id)
    {
        $application = BusinessApplication::where('user_id', auth()->id())->findOrFail($id);

        if (!$application->isPending()) {
            return response()->json([
                'message' => 'Cannot delete application that has already been reviewed'
            ], 400);
        }

        // Delete associated files
        $this->deleteApplicationFiles($application);
        
        $application->delete();

        return response()->json(['message' => 'Application deleted successfully']);
    }

    /**
     * Helper method to delete application files
     */
    private function deleteApplicationFiles(BusinessApplication $application)
    {
        $filesToDelete = [
            $application->logo,
            $application->business_license,
            $application->tax_certificate,
            $application->owner_id_document,
            $application->health_safety_cert,
            $application->address_proof
        ];

        foreach ($filesToDelete as $file) {
            if ($file && Storage::disk('public')->exists($file)) {
                Storage::disk('public')->delete($file);
            }
        }

        if ($application->storefront_photos) {
            foreach ($application->storefront_photos as $photo) {
                if (Storage::disk('public')->exists($photo)) {
                    Storage::disk('public')->delete($photo);
                }
            }
        }
    }
    
}