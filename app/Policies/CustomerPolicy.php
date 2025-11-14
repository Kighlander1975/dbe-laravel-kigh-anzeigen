<?php

namespace App\Policies;

use App\Models\Customer;

class CustomerPolicy
{
    public function before(?Customer $user, string $ability)
    {
        // Falls du Superadmin-Logik brauchst, hier abkürzen
        // if ($user && $user->isAdmin()) return null; // wir prüfen pro Ability
        return null;
    }

    public function viewAny(Customer $user): bool
    {
        return $user->isAdmin();
    }

    public function view(Customer $user, Customer $target): bool
    {
        // Admin darf alle sehen, Nutzer darf sich selbst sehen (optional)
        return $user->isAdmin() || $user->id === $target->id;
    }

    public function updateRole(Customer $user, Customer $target): bool
    {
        // Nur Admins
        if (!$user->isAdmin()) {
            return false;
        }

        // Admin darf seine eigene Rolle nicht ändern
        if ($user->id === $target->id) {
            return false;
        }

        return true;
    }
}
