-- =============================================================================
-- MIGRATIE: Klantenbeheer & Verbeterde Machinedata
-- =============================================================================
-- Voer dit uit in de Supabase SQL Editor nadat de code deploy is gedaan.
-- Dit script:
--   1. Maakt de 'klanten' tabel aan
--   2. Voegt nieuwe kolommen toe aan 'apparatuur'
--   3. Migreert bestaande data naar de nieuwe structuur
--   4. Schakelt RLS uit voor de nieuwe tabel
-- =============================================================================

-- 1. Maak de klanten tabel
create table if not exists klanten (
  id text primary key,
  bedrijfsnaam text not null,
  locatie text,
  contactpersoon text,
  contact_email text,
  contact_telefoon text,
  contract boolean default false,
  bijzonderheden text,
  custom_fields jsonb default '{}'::jsonb
);

-- 2. Voeg kolommen toe aan apparatuur (als ze nog niet bestaan)
alter table apparatuur add column if not exists klant_id text references klanten(id) on delete cascade;
alter table apparatuur add column if not exists merk text;
alter table apparatuur add column if not exists type_nummer text;
alter table apparatuur add column if not exists capaciteit text;
alter table apparatuur add column if not exists indeling_d text;
alter table apparatuur add column if not exists soort_weegschaal text;
alter table apparatuur add column if not exists soort_machine text;

-- 3. Migreer bestaande apparatuur naar klanten
-- Voor elke unieke combinatie van contactgegevens maken we een klant aan
-- Dit is een simplificatie: in werkelijkheid kan 1 contact bij meerdere klanten horen

-- Eerst: identificeer unieke klanten op basis van de bestaande data
-- Omdat we nog geen klanten hebben, groeperen we op contactpersoon + contact_email
-- (Dit is de beste benadering met de beschikbare data)

do $$
declare
  klant_record record;
  new_klant_id text;
begin
  -- Loop door unieke combinaties van (naam, locatie) — in de demo is dit 
  -- eigenlijk 3 klanten: "Afvalverwerking Voorbeeld" met de contacten Marc, Herman en Annelies
  -- Maar we migreren per apparaat zijn eigen klant (op basis van contactpersoon)
  
  for klant_record in 
    select distinct 
      naam as apparaat_naam,
      locatie as apparaat_locatie,
      contactpersoon,
      contact_email,
      contact_telefoon,
      contract,
      bijzonderheden,
      custom_fields
    from apparatuur 
    where apparatuur.klant_id is null
    order by contactpersoon
  loop
    new_klant_id := 'klant-' || floor(extract(epoch from now()) * 1000 + random() * 1000)::text;
    
    insert into klanten (id, bedrijfsnaam, locatie, contactpersoon, contact_email, contact_telefoon, contract, bijzonderheden, custom_fields)
    values (
      new_klant_id,
      klant_record.apparaat_naam,  -- tijdelijke naam op basis van apparaat
      klant_record.apparaat_locatie,
      klant_record.contactpersoon,
      klant_record.contact_email,
      klant_record.contact_telefoon,
      klant_record.contract,
      klant_record.bijzonderheden,
      klant_record.custom_fields
    );
    
    -- Update de bijbehorende apparatuur records
    update apparatuur 
    set 
      klant_id = new_klant_id,
      -- Zet oude velden om naar nieuwe structuur
      merk = case when apparatuur.model is not null and apparatuur.model != '' then split_part(apparatuur.model, ' ', 1) else null end,
      type_nummer = apparatuur.model,
      -- Voor weegschalen: capaciteit = weegbereik, indeling_d = nauwkeurigheid
      capaciteit = case when apparatuur.type = 'weegschaal' then apparatuur.weegbereik else null end,
      indeling_d = case when apparatuur.type = 'weegschaal' then apparatuur.nauwkeurigheid else null end,
      -- Machine-type bepalen obv naam (grove benadering)
      soort_machine = case 
        when apparatuur.naam ilike '%balenpers%' then 'Balenpers'
        when apparatuur.naam ilike '%schredder%' or apparatuur.naam ilike '%shredder%' then 'Shredder'
        else null
      end,
      soort_weegschaal = case 
        when apparatuur.type = 'weegschaal' and apparatuur.naam ilike '%vloer%' then 'Vloerweegschaal'
        when apparatuur.type = 'weegschaal' and apparatuur.naam ilike '%laboratorium%' then 'Precisiebalans'
        when apparatuur.type = 'weegschaal' and apparatuur.naam ilike '%bench%' then 'Tafelweegschaal'
        else null
      end
    where apparatuur.contactpersoon = klant_record.contactpersoon 
      and apparatuur.contact_email = klant_record.contact_email
      and apparatuur.klant_id is null;
  end loop;
end $$;

-- 4. Update klantnamen op basis van de geclusterde data
-- Groepeer apparatuur per klant en stel een nette bedrijfsnaam in
-- Voor de demo noemen we de klanten "Afvalverwerking Voorbeeld"
update klanten set bedrijfsnaam = 'Afvalverwerking Voorbeeld BV' where bedrijfsnaam in (
  select distinct apparatuur.naam from apparatuur where apparatuur.klant_id = klanten.id
);

-- 5. RLS uitschakelen voor de nieuwe tabel
alter table klanten disable row level security;

-- 6. Verwijder oude klantvelden uit apparatuur (optioneel, later)
-- comment deze regels uit als je de oude velden wilt bewaren voor backward compat:
-- alter table apparatuur drop column if exists contactpersoon;
-- alter table apparatuur drop column if exists contact_email;
-- alter table apparatuur drop column if exists contact_telefoon;
-- alter table apparatuur drop column if exists weegbereik;
-- alter table apparatuur drop column if exists nauwkeurigheid;

-- Klaar!
