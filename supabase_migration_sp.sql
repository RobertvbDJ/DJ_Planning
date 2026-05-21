-- Migratie: servicepartners naar objecten met contactgegevens
-- Voer dit uit in de Supabase SQL Editor

-- Update bestaande servicepartners van string[] naar object[]
update settings 
set servicepartners = (
  select jsonb_agg(
    jsonb_build_object(
      'id', 'sp-' || floor(extract(epoch from now()) * 1000 + row_number() over())::text,
      'name', value,
      'phone', '',
      'email', '',
      'notes', ''
    )
  )
  from jsonb_array_elements_text(servicepartners) as value
)
where id = 1;
