# Authenticatie & Login Plan

> **Status:** Plan fase

**Goal:** Voeg gebruikerslogin toe zodat niet iedereen de app kan gebruiken, met eenvoudig gebruikersbeheer.

**Architectuur:** Supabase Auth (ingebouwd, makkelijkst) met e-mail/wachtwoord login. Eenvoudig admin paneel om gebruikers uit te nodigen.

**Tech Stack:** Supabase Auth (ingebouwd), React state voor auth context

---

## Waarom Supabase Auth?

- Supabase heeft een **kant-en-klare authenticatie** met e-mail/wachtwoord
- Geen extra database tabellen nodig — gebruikers worden beheerd in `auth.users`
- De anon key kan blijven werken, maar we voegen **Row Level Security (RLS)** toe zodat alleen ingelogde gebruikers data kunnen lezen/schrijven
- Eenvoudig te implementeren met de Supabase JS client library

---

## Fase 1: Auth Setup

### Task 1: Supabase Auth inschakelen

**In Supabase Dashboard:**
1. Ga naar **Authentication → Settings**
2. Zet **"Enable email confirmations"** op OFF (voor nu — anders moeten gebruikers hun email bevestigen)
3. Zet **"Security → Max request per 30 seconds"** op een redelijke waarde

**Geen code wijzigingen — dit is een configuratie in het dashboard.**

### Task 2: RLS Policies schrijven

**Bestand:** Nieuw SQL bestand `supabase_rls.sql`

Voor elke tabel (`klanten`, `apparatuur`, `taken`, `settings`) moeten RLS policies worden aangemaakt:

```sql
-- Eerst RLS inschakelen op alle tabellen
alter table klanten enable row level security;
alter table apparatuur enable row level security;
alter table taken enable row level security;
alter table settings enable row level security;

-- Policies: alleen geauthenticeerde gebruikers kunnen lezen/schrijven
create policy "authenticated users can read klanten"
  on klanten for select using (auth.role() = 'authenticated');

create policy "authenticated users can insert klanten"
  on klanten for insert with check (auth.role() = 'authenticated');

create policy "authenticated users can update klanten"
  on klanten for update using (auth.role() = 'authenticated');

create policy "authenticated users can delete klanten"
  on klanten for delete using (auth.role() = 'authenticated');

-- Herhaal voor apparatuur, taken, settings
-- ...
```

**Uitvoeren:** Via Supabase SQL Editor of Management API

---

## Fase 2: App Code Aanpassingen

### Task 3: Supabase JS client installeren

```bash
cd client && npm install @supabase/supabase-js
```

### Task 4: Auth context + login pagina maken

**Nieuwe bestanden:**
- `client/src/AuthContext.jsx` — React context voor auth state
- `client/src/LoginPage.jsx` — Login/registreer scherm

**Bestaande bestanden wijzigen:**
- `client/src/main.jsx` — Wrap app in AuthContext provider
- `client/src/App.jsx` — Check auth state, toon LoginPage als niet ingelogd

### AuthContext.jsx (nieuw)

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check bestaande sessie
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });

    // Luister naar auth wijzigingen
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### LoginPage.jsx (nieuw)

- Eenvoudig formulier met e-mail + wachtwoord
- Tabbladen: "Inloggen" en "Account aanmaken"
- Na succesvolle login -> redirect naar app
- Styling consistent met bestaande app (donker thema)

### App.jsx wijzigingen

```jsx
import { useAuth } from './AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Laden...</div>;
  if (!user) return <LoginPage />;

  // Bestaande app code...
}
```

### Task 5: Update data fetching

**Wijziging in `getSupabaseHeaders()`:**
De auth token moet worden meegegeven in de headers:

```jsx
const getSupabaseHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Prefer': 'return=representation'
  };
};
```

Of nog beter: gebruik de Supabase client library in plaats van directe `fetch()` calls.

---

## Fase 3: Gebruikersbeheer

### Task 6: Admin gebruikersbeheer (eenvoudig)

**Toevoegen aan Tab 5 of header:**
- Knop "Gebruikersbeheer" (alleen zichtbaar voor admin)
- Lijst van gebruikers uit `auth.users` (via Supabase Management API of Edge Function)
- Mogelijkheid om nieuwe gebruikers uit te nodigen (registratie via app)

**Eenvoudigere optie:** Gebruikers worden handmatig aangemaakt via het Supabase Dashboard (Authentication → Users → Add User). De login pagina staat dan alleen inloggen toe, niet registreren.

---

## Overzicht bestanden

| Bestand | Actie | Type |
|---------|-------|------|
| `supabase_rls.sql` | Nieuw | SQL |
| `client/package.json` | Wijzig | Toevoeg `@supabase/supabase-js` |
| `client/src/AuthContext.jsx` | Nieuw | React Context |
| `client/src/LoginPage.jsx` | Nieuw | Login scherm |
| `client/src/main.jsx` | Wijzig | Wrap in AuthProvider |
| `client/src/App.jsx` | Wijzig | Auth check + beveiliging |

---

## Risico's & Overwegingen

1. **RLS moet correct zijn** — verkeerde policies kunnen data ontoegankelijk maken. Testen met ingelogde en niet-ingelogde sessie.
2. **Bestaande data blijft werken** — RLS policies gelden alleen voor nieuwe requests. Bestaande data blijft intact.
3. **Lokale modus** — De lokale server (zonder Supabase) werkt dan niet meer met auth. Overweeg of we lokale modus willen behouden of verwijderen.
4. **E-mail confirmaties** — Voor nu uitzetten, maar voor productie is aan te raden om aan te zetten.
5. **Wachtwoord vergeten** — Kan later worden toegevoegd via Supabase Auth's `resetPasswordForEmail()`.
