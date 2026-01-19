<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            // Make vendor_id nullable and unsigned big integer
            $table->unsignedBigInteger('vendor_id')->nullable()->change();
            
            // Add foreign key constraint
             $foreignKeyExists = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'businesses' 
            AND COLUMN_NAME = 'vendor_id' 
            AND TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'users'
        ")[0]->count;

        if ($foreignKeyExists == 0) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->foreign('vendor_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }
        });
    }

    public function down(): void
    {
         Schema::table('businesses', function (Blueprint $table) {
            $table->dropForeign(['vendor_id']);
                    });

    }
};