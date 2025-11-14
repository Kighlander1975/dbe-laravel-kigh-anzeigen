<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdminController extends Controller
{

    public function dashboard(Request $request)
    {
        // Beispiel: kleine Kennzahl(en) für das Dashboard
        // $usersCount = \App\Models\User::count();
        // return view('admin.dashboard', compact('usersCount'));

        return view('admin.dashboard');
    }
}
