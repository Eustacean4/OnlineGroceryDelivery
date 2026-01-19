<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up()
{
    Schema::table('products', function (Blueprint $table) {
        $table->unsignedBigInteger('business_id')->after('category_id');
        $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('products', function (Blueprint $table) {
        $table->dropForeign(['business_id']);
        $table->dropColumn('business_id');
    });
}

};
