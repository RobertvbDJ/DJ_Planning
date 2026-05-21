# Klantenbeheer, Machinedata & Authenticatie Plan

## Overzicht

Op dit moment staat alles in één `apparatuur` tabel — klantgegevens (naam, locatie, contact) zitten door elkaar met machinegegevens. Het moet worden opgesplitst: eerst een klant aanmaken, daarbinnen meerdere machines beheren.

---

## Fase 1: Database Schema Wijziging

### Nieuwe tabel: `klanten`

| Veld | Type | Opmerking |
|------|------|-----------|
| `id` | text PK | `klant-` + timestamp |
| `bedrijfsnaam` | text | Verplicht |
| `locatie` | text | Vestigingsadres/locatie |
| `contactpersoon` | text | |
| `contact_email` | text | |
| `contact_telefoon` | text | |
| `contract` | boolean | Servicecontract? |
| `bijzonderheden` | text | Algemene notities |
| `custom_fields` | jsonb | Systeembrede custom fields |

### Gewijzigde tabel: `apparatuur`

Wordt ontkoppeld van klantgegevens, krijgt `klant_id` FK en betere machine-specifieke velden:

| Veld | Type | Opmerking |
|------|------|-----------|
| `id` | text PK | |
| `klant_id` | text FK→klanten.id | Verplicht |
| `soort` | text | `weegschaal` of `afvalmachine` |
| `locatie` | text | Specifieke plek bij klant (bv "Hal A") |
| **Weegschaal-specifiek** | | |
| `merk` | text | |
| `type_nummer` | text | |
| `serienummer` | text | |
| `capaciteit` | text | bv "0-60 kg" |
| `indeling_d` | text | bv "5 g" |
| `soort_weegschaal` | text | Vloerweegschaal, Palletweegschaal, Precisiebalans, etc. |
| **Afvalmachine-specifiek** | | |
| `merk` | text | |
| `type_nummer` | text | |
| `serienummer` | text | |
| `soort_machine` | text | Shredder, Balenpers, Containerpers, etc. |
| **Gemeenschappelijk** | | |
| `interval_maanden` | int | 6 of 12 |
| `laatste_datum` | date | |
| `volgende_datum` | date | |
| `custom_fields` | jsonb | |

*Opmerking: `weegbereik` en `nauwkeurigheid` worden vervangen door `capaciteit` en `indeling_d` (meer herkenbare termen).*

### `taken` tabel

Blijft vrijwel hetzelfde, alleen `equipment_id` verwijst nu naar de nieuwe `apparatuur` structuur (geen wijziging nodig).

---

## Fase 2: UI Aanpassingen

### Nieuwe tab: "Klantenbeheer"

Of een herindeling van Tab 5 (Register):

**Tab 5 wordt: "Klanten & Apparaten"** met twee kolommen of een split-view:
- **Links:** Klantenlijst (zoek, filter)
- **Rechts / bij klik:** Geselecteerde klant met zijn/haar machines

### Nieuwe modals:

1. **Klant aanmaken/bewerken modal** — bedrijfsnaam, locatie, contactgegevens, contract, bijzonderheden
2. **Machine toevoegen modal** — gekoppeld aan een klant, met de nieuwe specifieke velden (merk, type, serienummer, soort machine of soort weegschaal + capaciteit/indeling)

### Aanpassingen in taken:

- Taak aanmaken: kies eerst klant, dan machine
- Taakkaart toont klantnaam + machinenaam
- Bulk-verzendlijst toont klantnaam i.p.v. alleen machinenaam

---

## Fase 3: Data Migratie (bestaande data)

Bij eerste deploy na de wijziging:
- Voor elke unieke combinatie van `naam`+`locatie` in `apparatuur` een `klant` aanmaken
- `apparatuur.klant_id` instellen op de nieuwe klant
- Klantvelden overzetten: `naam`→`bedrijfsnaam`, contactgegevens, `contract`, `bijzonderheden`

---

## Fase 4: Authenticatie (later)

Herinnering aan de user: login/gebruikersbeheer toevoegen.

Mogelijke aanpak:
- Supabase Auth (ingebouwd, makkelijkst)
- Eenvoudig wachtwoord-schermpje voor de app
- Gebruikersrollen: admin (alles), planner (taken muteren), viewer (alleen kijken)

---

## Prioriteit & Volgorde

1. ✅ Database schema aanpassen (nieuwe `klanten` tabel, `apparatuur` aanpassen)
2. ✅ Data migratie script voor bestaande demo-data
3. ✅ UI: Klantenbeheer tab + klant-modal
4. ✅ UI: Machine toevoegen gekoppeld aan klant
5. ✅ UI: Taken koppelen via klant→machine pad
6. ⏳ Authenticatie (later)
