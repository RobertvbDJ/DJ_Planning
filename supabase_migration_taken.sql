-- Voeg apparatuur_lijst kolom toe aan taken voor vrije-invoer apparaten
alter table taken add column if not exists apparatuur_lijst jsonb default '[]'::jsonb;

-- Werk bestaande taken bij: zet equipment_id om naar apparatuur_lijst
update taken set apparatuur_lijst = (
  select jsonb_agg(
    jsonb_build_object(
      'id', apparatuur.id,
      'naam', apparatuur.naam,
      'merk', apparatuur.merk,
      'type_nummer', apparatuur.type_nummer,
      'serienummer', apparatuur.serienummer,
      'locatie', apparatuur.locatie,
      'capaciteit', apparatuur.capaciteit,
      'indeling_d', apparatuur.indeling_d,
      'soort_weegschaal', apparatuur.soort_weegschaal,
      'soort_machine', apparatuur.soort_machine
    )
  )
  from apparatuur
  where apparatuur.id = taken.equipment_id
)
where equipment_id is not null and equipment_id != '';
