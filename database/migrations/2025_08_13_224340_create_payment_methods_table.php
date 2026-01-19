<?php
// database/migrations/xxxx_xx_xx_create_payment_methods_table.php

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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('card_type'); // visa, mastercard, amex
            $table->text('card_number'); // Encrypted
            $table->string('card_holder_name');
            $table->string('expiry_month', 2);
            $table->string('expiry_year', 4);
            $table->text('cvv'); // Encrypted
            $table->boolean('is_default')->default(false);
            $table->string('display_name')->nullable();
            $table->timestamps();
            
            // Index for faster queries
            $table->index(['user_id', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};