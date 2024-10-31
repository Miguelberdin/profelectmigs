<?php

namespace App\Http\Controllers;

use App\Models\Chirp;
use App\Models\Comment;
use Illuminate\Http\Request;
use App\Models\Notification;

class CommentController extends Controller
{
    public function store(Request $request, Chirp $chirp)
    {
        // Validate the incoming data
        $validated = $request->validate([
            'content' => 'required|string|max:255',
        ]);

        // Create a new comment associated with the chirp and the authenticated user
        $comment = $chirp->comments()->create([
            'user_id' => auth()->id(),
            'content' => $validated['content'],
        ]);

        // Only notify if the comment is from a different user than the chirp owner
        if ($chirp->user_id !== auth()->id()) {
            Notification::create([
                'user_id' => $chirp->user_id,   // Notify the chirp owner
                'type' => 'comment',
                'chirp_id' => $chirp->id,
                'is_read' => false,
            ]);
        }

        // Return the created comment with user information
        return response()->json(['comment' => $comment->load('user')]);
    }

    public function index(Chirp $chirp)
    {
        // Fetch all comments for the specified chirp
        return response()->json(['comments' => $chirp->comments()->with('user')->get()]);
    }
}
