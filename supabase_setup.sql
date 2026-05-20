-- =============================================================================
-- SUPABASE DATABASE SETUP & DEMO DATA SEEDING
-- -----------------------------------------------------------------------------
-- Dit script maakt de benodigde tabellen aan voor de Kalibratie & Onderhoud planner,
-- schakelt Row Level Security (RLS) uit voor publieke client-side toegang (anon key),
-- en voegt de Nederlandse voorbeelddata toe voor een vliegende start.
-- 
-- HOE TE GEBRUIKEN:
-- 1. Ga naar je Supabase dashboard (https://supabase.com).
-- 2. Open je project en klik in het linkermenu op "SQL Editor".
-- 3. Klik op "+ New query" (Nieuwe query).
-- 4. Plak deze VOLLEDIGE code in de SQL Editor.
-- 5. Klik rechtsonder op de knop "Run" (Uitvoeren).
-- =============================================================================

-- 1. Verwijder bestaande tabellen indien aanwezig (voor een schone start)
drop table if exists taken;
drop table if exists apparatuur;
drop table if exists settings;

-- 2. Maak de 'settings' tabel aan (voor algemene instellingen en custom fields)
create table settings (
  id integer primary key,
  servicepartners jsonb not null,
  global_custom_fields jsonb not null
);

-- 3. Maak de 'apparatuur' tabel aan (voor weegschalen en afvalbewerkingsmachines)
create table apparatuur (
  id text primary key,
  type text not null, -- 'weegschaal' of 'afvalmachine'
  naam text not null,
  model text,
  serienummer text,
  locatie text not null,
  weegbereik text,
  nauwkeurigheid text,
  interval_maanden integer default 12,
  laatste_datum date,
  volgende_datum date,
  contract boolean default false,
  contactpersoon text,
  contact_email text,
  contact_telefoon text,
  bijzonderheden text,
  custom_fields jsonb default '{}'::jsonb
);

-- 4. Maak de 'taken' tabel aan (voor kalibraties, onderhoudstaken en storingen)
create table taken (
  id text primary key,
  equipment_id text references apparatuur(id) on delete cascade,
  titel text not null,
  type text not null, -- 'kalibratie', 'onderhoud' of 'storing'
  status text not null, -- te_benaderen, wacht_op_klant, reminder_gestuurd, opdracht_ontvangen, wacht_op_reactie_td, ingepland, rapportage, afgerond, klant_wil_niet
  prioriteit text default 'medium', -- laag, medium, hoog
  geplande_datum date not null,
  bezoekdatum date,
  servicepartner text,
  omschrijving text,
  technicus text
);

-- 5. Schakel Row Level Security (RLS) uit
-- Hierdoor kan de client via de 'anon key' rechtstreeks data lezen/schrijven
-- zonder dat er een Vercel-backend of ingewikkelde inlogprocedures nodig zijn.
alter table settings disable row level security;
alter table apparatuur disable row level security;
alter table taken disable row level security;

-- 6. Voeg de globale instellingen en servicepartners toe
insert into settings (id, servicepartners, global_custom_fields)
values (
  1,
  '["WeegTechniek NL", "MilieuService Partners", "TechFix Industrie"]'::jsonb,
  '["Contactpersoon TD", "Toegangscode hek", "Specifieke instructie technicus", "Certificaatnummer"]'::jsonb
);

-- 7. Voeg de apparatuur (weegschalen en machines) toe
insert into apparatuur (id, type, naam, model, serienummer, locatie, weegbereik, nauwkeurigheid, interval_maanden, laatste_datum, volgende_datum, contract, contactpersoon, contact_email, contact_telefoon, bijzonderheden, custom_fields)
values
(
  'eq-1', 
  'weegschaal', 
  'Mettler Toledo Bench Scale', 
  'ICS465', 
  'MT-988371-B', 
  'Hal A - Inpak', 
  '0 - 15 kg', 
  '1 g', 
  12, 
  '2025-06-15', 
  '2026-06-15', 
  true, 
  'Marc de Vries', 
  'm.devries@afvalverwerking-voorbeeld.nl', 
  '06-12345678', 
  'Weegschaal wordt intensief gebruikt voor verzendingen. Kalibratie bij voorkeur in de ochtend.', 
  '{"Contactpersoon TD": "Gert-Jan (WeegTechniek)", "Toegangscode hek": "1234#", "Specifieke instructie technicus": "Meldkamer eerst bellen bij aankomst."}'::jsonb
),
(
  'eq-2', 
  'weegschaal', 
  'PBA430 Vloerweegschaal', 
  'PBA430-CC150', 
  'MT-449201-V', 
  'Expeditie - Goederenontvangst', 
  '0 - 150 kg', 
  '10 g', 
  6, 
  '2025-12-10', 
  '2026-06-10', 
  true, 
  'Marc de Vries', 
  'm.devries@afvalverwerking-voorbeeld.nl', 
  '06-12345678', 
  'Ingebouwd in de vloer. Moet schoongemaakt worden voor kalibratie.', 
  '{"Contactpersoon TD": "Gert-Jan (WeegTechniek)", "Toegangscode hek": "1234#", "Specifieke instructie technicus": "Heftruckverkeer stilleggen tijdens meting."}'::jsonb
),
(
  'eq-3', 
  'afvalmachine', 
  'Balenpers HSM V-Press 860', 
  'V-Press 860 Eco', 
  'HSM-860-2022-09', 
  'Buiten - Milieustraat', 
  'N.v.t.', 
  'N.v.t.', 
  12, 
  '2025-07-20', 
  '2026-07-20', 
  true, 
  'Herman de Jong', 
  'h.dejong@afvalverwerking-voorbeeld.nl', 
  '06-87654321', 
  'Hydraulische pers voor karton en plastic. Staat onder een overkapping.', 
  '{"Contactpersoon TD": "Kees (MilieuService)", "Toegangscode hek": "Geen hek, vrije inloop", "Specifieke instructie technicus": "Pers leegmaken voor keuring."}'::jsonb
),
(
  'eq-4', 
  'afvalmachine', 
  'Schredder Lindner Micromat', 
  'Micromat 1500', 
  'LND-1500-4829', 
  'Hal B - Kunststofverwerking', 
  'N.v.t.', 
  'N.v.t.', 
  6, 
  '2025-11-05', 
  '2026-05-05', 
  false, 
  'Herman de Jong', 
  'h.dejong@afvalverwerking-voorbeeld.nl', 
  '06-87654321', 
  'Zwaar belaste machine. Messen moeten gecontroleerd worden op slijtage.', 
  '{"Contactpersoon TD": "Richard (MilieuService)", "Toegangscode hek": "9988*", "Specifieke instructie technicus": "Lock-out tag-out (LOTO) procedure strikt volgen!"}'::jsonb
),
(
  'eq-5', 
  'weegschaal', 
  'Sartorius Laboratoriumweegschaal', 
  'Secura 224-1S', 
  'SAR-88203-L', 
  'Laboratorium - Kwaliteitsdienst', 
  '0 - 220 g', 
  '0.1 mg', 
  12, 
  '2025-05-15', 
  '2026-05-15', 
  false, 
  'Annelies Bakker', 
  'a.bakker@afvalverwerking-voorbeeld.nl', 
  '06-11223344', 
  'Analytische balans. Extreem trillingsgevoelig. Moet ter plaatse gekalibreerd worden.', 
  '{"Contactpersoon TD": "Gert-Jan (WeegTechniek)", "Toegangscode hek": "Lab-sleutel bij receptie", "Specifieke instructie technicus": "Labjas en haarnetje verplicht."}'::jsonb
);

-- 8. Voeg de openstaande taken (planningen en storingen) toe
insert into taken (id, equipment_id, titel, type, status, prioriteit, geplande_datum, bezoekdatum, servicepartner, omschrijving, technicus)
values
(
  'task-1', 
  'eq-1', 
  'Kalibratie Mettler Toledo Hal A', 
  'kalibratie', 
  'opdracht_ontvangen', 
  'medium', 
  '2026-06-15', 
  null, 
  'WeegTechniek NL', 
  'Jaarlijkse kalibratie van de tafelweegschaal in Hal A.', 
  ''
),
(
  'task-2', 
  'eq-2', 
  'Kalibratie PBA430 Vloerweegschaal', 
  'kalibratie', 
  'te_benaderen', 
  'medium', 
  '2026-06-10', 
  null, 
  'WeegTechniek NL', 
  'Halfjaarlijkse kalibratie van de ingebouwde vloerweegschaal.', 
  ''
),
(
  'task-3', 
  'eq-3', 
  'Periodiek Onderhoud Balenpers HSM', 
  'onderhoud', 
  'wacht_op_klant', 
  'medium', 
  '2026-07-20', 
  null, 
  'MilieuService Partners', 
  'Jaarlijkse keuring en onderhoudsbeurt aan de balenpers.', 
  ''
),
(
  'task-4', 
  'eq-4', 
  'Onderhoud Schredder Lindner Hal B', 
  'onderhoud', 
  'wacht_op_reactie_td', 
  'hoog', 
  '2026-05-05', 
  null, 
  'MilieuService Partners', 
  'Halfjaarlijkse controle en messenslijtage-meting.', 
  ''
),
(
  'task-5', 
  'eq-5', 
  'Kalibratie Sartorius Laboratorium', 
  'kalibratie', 
  'ingepland', 
  'medium', 
  '2026-05-15', 
  '2026-05-22', 
  'WeegTechniek NL', 
  'Jaarlijkse fijnkalibratie labbalans.', 
  ''
),
(
  'task-6', 
  'eq-3', 
  'Storing: Perscilinder lekt hydrauliekolie', 
  'storing', 
  'ingepland', 
  'hoog', 
  '2026-05-20', 
  '2026-05-21', 
  'TechFix Industrie', 
  'De perscilinder lekt olie aan de linkerkant. Hierdoor bouwt de pers onvoldoende druk op voor de balen.', 
  ''
);
