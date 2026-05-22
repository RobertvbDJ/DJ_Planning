# 📅 Kalibratie, Onderhoud & Storingsplanner

Op maat gemaakte planner voor **De Jong systemen** — een React SPA met Supabase backend, gehost op Vercel.

---

## 🌐 Live App

[https://planning-dusky.vercel.app](https://planning-dusky.vercel.app)

---

## 🚀 Workflows

### Periodieke Planning (Tab 1 — Kanban)

**Nieuwe klantgebaseerde flow:**

1. **Klant aanmaken** met een **Bezoekmaand** (bv. Juni) → zie tabblad **Klanten & Apparaten Register**
2. Een maand voor de bezoekmaand (dus in Mei voor Juni) verschijnt de klant **automatisch** als kaart in **Te Benaderen**
3. **Sleep de kaart** naar een volgende kolom (bv. **Wacht op Klant**) → er wordt een echte taak aangemaakt
4. Werk de taak bij: status, servicepartner, datum, etc.
5. Na afronding (kolom **Afgerond**) verdwijnt de taak
6. **Volgend jaar** verschijnt de klantkaart weer vanzelf in Te Benaderen

**Ad-hoc taken** (via knop **Storing / Taak Melden**):
- Storingen en reparaties handmatig aanmaken
- Doorlopen dezelfde kanban-flow
- Apart tabblad **Storingen & Reparaties** voor storingen

### Kolommen in het periodieke bord:
| Kolom | Betekenis |
|---|---|
| Te Benaderen (1m vooraf) | Klanten met bezoekmaand volgende maand |
| Wacht op Klant | Klant is benaderd, wacht op akkoord |
| Reminder Gestuurd | Herinnering gestuurd |
| Opdracht Ontvangen | Akkoord, planning wordt gemaakt |
| Wacht op Reactie TD | Ticket naar TD gestuurd |
| Ingepland | Exacte datum + dagdeel vastgelegd |
| Rapportage / Afronding | Werk uitgevoerd, rapportage volgt |

### Storingen & Reparaties (Tab 2)
Kort kanban-bord voor ad-hoc storingen (rode badge). Omzeilt de benader-fases.

### Kalenderweergave (Tab 3)
Taken met een bezoekdatum verschijnen in een maandkalender.

### Servicepartner Bulk-Verzending (Tab 4)
Alle opdrachten met status "Opdracht Ontvangen" gegroepeerd per servicepartner. Kopieer e-mailtekst of markeer als doorgegeven.

### Klanten & Apparaten Register (Tab 5)
Beheer klanten, machines/weegschalen, contracten. Per klant in te stellen: **Bezoekmaand**, contactgegevens, notities.

---

## ⚙️ Instellingen (Tab 6)

### 👤 Gebruikersbeheer (alleen Admin)
- Lijst van alle medewerkers
- Nieuwe gebruiker aanmaken (e-mail + wachtwoord)
- Rol wijzigen: Staff ↔ Admin
- Gebruiker verwijderen
- Naam bewerken

### 📋 Custom Velden
Velden die op alle klant- en machinekaarten verschijnen (bv. "Toegangscode hek", "Contactpersoon TD").

### 🤝 Servicepartners
Beheer uitvoerende partijen (KBN, M&H Techniek, etc.).

### ⚖️ Weegschaal Types / 🔩 Machine Types
Types die beschikbaar zijn bij het toevoegen van apparatuur.

---

## 🏗️ Technische Stack

| Onderdeel | Technologie |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (dark theme) |
| Database | Supabase (PostgreSQL) |
| Authenticatie | Supabase Auth (e-mail/wachtwoord) |
| Hosting | Vercel (automatische deploys via GitHub) |
| Icons | Lucide React |
| Fonts | Outfit |

---

## 🔧 Ontwikkeling

```bash
# Installeren
cd client && npm install

# Lokaal draaien (met VITE_ env vars in .env)
npm run dev

# Bouwen
npm run build
```

## 🌍 Omgevingsvariabelen (Vercel)

| Variabele | Waarde |
|---|---|
| `VITE_SUPABASE_URL` | `https://yeaysglgpdjozcgmflxc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key (publishable) |
| `SUPABASE_MANAGEMENT_TOKEN` | PAT voor admin API |

## 🔁 Deploy

Push naar `master` → Vercel bouwt en deployt automatisch.

```
git push origin master
```

[https://github.com/RobertvbDJ/DJ_Planning](https://github.com/RobertvbDJ/DJ_Planning)
