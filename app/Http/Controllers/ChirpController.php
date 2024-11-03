<?php

namespace App\Http\Controllers;

use App\Models\Chirp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChirpController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Chirps/Index', [
            'chirps' => Chirp::with([
                'user:id,name',
                'reactions.user:id,name',  // Load reactions with user details
                'comments.user:id,name'    // Load comments with user details
            ])->latest()->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:255',
        ]);
    
        $chirp = $request->user()->chirps()->create($validated);
    
        // Load user data to include it in the response
        $chirp->load('user:id,name');
    
        return response()->json([
            'message' => 'Chirp created successfully.',
            'chirp' => $chirp,
        ]);
    }
    

    /**
     * Display the specified resource.
     */
    public function show(Chirp $chirp)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Chirp $chirp)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    /**
 * Update the specified resource in storage.
 */
public function update(Request $request, Chirp $chirp)
{
    Gate::authorize('update', $chirp);

    $validated = $request->validate([
        'message' => 'required|string|max:255',
    ]);

    $chirp->update($validated);

    return response()->json([
        'message' => 'Chirp updated successfully.',
        'chirp' => $chirp->load('user:id,name'), // Include related data with updated timestamp
    ]);
}
/**
 * Remove the specified resource from storage.
 */
public function destroy(Chirp $chirp)
{
    Gate::authorize('delete', $chirp);

    // Delete all related data if any (e.g., reactions, comments)
    $chirp->reactions()->delete();
    $chirp->comments()->delete();

    $chirp->delete();

    return response()->json(['message' => 'Chirp deleted successfully.']);
}

}