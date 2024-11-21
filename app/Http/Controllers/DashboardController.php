<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\Chirp;
use App\Models\Reaction;
use App\Models\Comment;
use App\Models\User;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        try {
            // Get the authenticated user ID from the injected request object
            $userId = $request->user()->id;

            \Log::info("Fetching stats for user: {$userId}");

            // Fetch statistics specifically for the authenticated user
            $numberOfPosts = Chirp::where('user_id', $userId)->count();
            $reactionsReceived = Reaction::whereHas('chirp', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })->where('user_id', '!=', $userId)->count();

            $commentsReceived = Comment::whereHas('chirp', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })->where('user_id', '!=', $userId)->count();

            $latestComments = Comment::with('user')
                ->whereHas('chirp', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->where('user_id', '!=', $userId)
                ->latest()
                ->take(5)
                ->get();

            // Top 3 reactors and commenters based on the number of reactions or comments they have made
            $topReactors = User::withCount(['reactions' => function ($query) use ($userId) {
                $query->whereHas('chirp', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })->where('user_id', '!=', $userId);
            }])->orderBy('reactions_count', 'desc')->take(3)->get();

            $topCommenters = User::withCount(['comments' => function ($query) use ($userId) {
                $query->whereHas('chirp', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })->where('user_id', '!=', $userId);
            }])->orderBy('comments_count', 'desc')->take(3)->get();

            // Fetch daily stats for the last 7 days
            $dailyStats = [
                'dates' => [],
                'posts' => [],
                'reactions' => [],
                'comments' => [],
            ];

            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i)->toDateString();
                $dailyStats['dates'][] = $date;

                $dailyStats['posts'][] = Chirp::where('user_id', $userId)
                    ->whereDate('created_at', $date)
                    ->count();

                $dailyStats['reactions'][] = Reaction::whereHas('chirp', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })->whereDate('created_at', $date)
                ->where('user_id', '!=', $userId)->count();

                $dailyStats['comments'][] = Comment::whereHas('chirp', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })->whereDate('created_at', $date)
                ->where('user_id', '!=', $userId)->count();
            }

            return response()->json([
                'numberOfPosts' => $numberOfPosts,
                'reactionsReceived' => $reactionsReceived,
                'commentsReceived' => $commentsReceived,
                'latestComments' => $latestComments->map(function ($comment) {
                    return [
                        'user' => $comment->user ? $comment->user->name : 'Unknown User',
                        'content' => $comment->content,
                        'created_at' => $comment->created_at->toIso8601String(),
                    ];
                }),
                'topReactors' => $topReactors->map(function ($reactor) {
                    return [
                        'name' => $reactor->name,
                        'reactions_count' => $reactor->reactions_count,
                    ];
                }),
                'topCommenters' => $topCommenters->map(function ($commenter) {
                    return [
                        'name' => $commenter->name,
                        'comments_count' => $commenter->comments_count,
                    ];
                }),
                'dailyStats' => $dailyStats,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching dashboard statistics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch dashboard statistics'], 500);
        }
    }
}
