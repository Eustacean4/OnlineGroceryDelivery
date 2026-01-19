<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create business_applications table
        Schema::create('business_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Vendor who submitted
            
            // Basic business information
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->text('address');
            $table->string('logo')->nullable();
            
            // Required documents
            $table->string('business_license'); // Business registration certificate
            $table->string('tax_certificate'); // Tax ID/VAT certificate
            $table->string('owner_id_document'); // Owner's ID document
            $table->string('health_safety_cert')->nullable(); // Health & safety certifications
            $table->string('address_proof'); // Utility bill or lease agreement
            $table->json('storefront_photos'); // Array of storefront photo paths
            
            // Application status
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->text('admin_notes')->nullable(); // Internal admin notes
            
            // Approval tracking
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable(); // Admin who reviewed
            
            // Reference to created business (if approved)
            $table->unsignedBigInteger('business_id')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('set null');
            
            // Indexes
            $table->index(['status', 'submitted_at']);
            $table->index('user_id');
        });

        // Add status column to existing businesses table for approved businesses
        Schema::table('businesses', function (Blueprint $table) {
            $table->enum('status', ['active', 'suspended', 'inactive'])->default('active')->after('address');
            $table->unsignedBigInteger('application_id')->nullable()->after('status');
            
            // Foreign key to link back to the original application
            $table->foreign('application_id')->references('id')->on('business_applications')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
            $table->dropColumn(['status', 'application_id']);
        });
        
        Schema::dropIfExists('business_applications');
    }
};