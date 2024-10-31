<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Notification;

class Reaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'chirp_id',
        'user_id',
        'type',
    ];

    public function chirp()
    {
        return $this->belongsTo(Chirp::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
