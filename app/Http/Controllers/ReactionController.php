<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Reaction;
use App\Models\Chirp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    public function store(Request $request, $chirpId)
    {
        $request->validate([
            'type' => 'required|string',
        ]);

        // Create or update the reaction
        $reaction = Reaction::updateOrCreate(
            [
                'chirp_id' => $chirpId,
                'user_id' => Auth::id(),
            ],
            ['type' => $request->type]
        );

        // Fetch the chirp to get the owner ID
        $chirp = Chirp::findOrFail($chirpId);

        // Only notify if the reaction is from a different user than the chirp owner
        if ($chirp->user_id !== Auth::id()) {
            Notification::create([
                'user_id' => $chirp->user_id,    // Notify the chirp owner
                'type' => 'reaction',
                'chirp_id' => $chirpId,
                'is_read' => false,
            ]);
        }

        // Return updated reactions for this chirp with user details
        return response()->json(['reactions' => Reaction::where('chirp_id', $chirpId)->with('user')->get()]);
    }
}
