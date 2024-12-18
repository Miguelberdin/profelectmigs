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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // User to be notified
            $table->foreignId('notifier_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // 'reaction' or 'comment'
            $table->foreignId('chirp_id')->constrained()->onDelete('cascade');
            $table->string('reaction_type')->nullable(); // The type of reaction (e.g., 'like', 'love', etc.)
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
