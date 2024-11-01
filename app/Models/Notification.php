<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'notifier_id', 'type', 'chirp_id', 'reaction_type', 'is_read',
    ];    

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function notifier()
{
    return $this->belongsTo(User::class, 'notifier_id');
}

}