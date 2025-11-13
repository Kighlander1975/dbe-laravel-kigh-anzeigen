<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): View
    {
        return view('auth.register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers',
            'password' => 'required|string|confirmed|min:8',
            'plz' => 'required|string',
            'ort' => 'required|string',
            'strasse' => 'required|string',
            'hausnummer' => 'required|string',
            'telefonnummer' => 'required|string'
        ]);


        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'plz' => $request->plz,
            'ort' => $request->ort,
            'strasse' => $request->strasse,
            'hausnummer' => $request->hausnummer,
            'telefonnummer' => $request->telefonnummer
        ]);

        event(new Registered($customer));

        Auth::login($customer);

        return redirect()->route('home');
    }
}
