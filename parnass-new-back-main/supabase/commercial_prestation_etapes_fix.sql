-- =============================================
-- Fix: Corrupted Prestation Etapes Data
-- This fixes the double-nested JSON issue where address_id contains a stringified JSON
-- =============================================

-- Fix prestations where etapes have corrupted address_id (stringified JSON)
UPDATE prestation
SET etapes = (
  SELECT array_agg(
    CASE 
      -- If address_id starts with '{', it's a stringified JSON - extract the real address_id
      WHEN (elem->>'address_id') LIKE '{%' THEN
        jsonb_build_object(
          'address_id', ((elem->>'address_id')::jsonb)->>'address_id',
          'heure_depart', COALESCE(((elem->>'address_id')::jsonb)->>'heure_depart', elem->>'heure_depart'),
          'heure_arrivee', COALESCE(((elem->>'address_id')::jsonb)->>'heure_arrivee', elem->>'heure_arrivee'),
          'vide', COALESCE((((elem->>'address_id')::jsonb)->>'vide')::boolean, (elem->>'vide')::boolean, false)
        )
      -- Otherwise it's already correct format
      ELSE elem
    END
    ORDER BY ordinality
  )
  FROM unnest(etapes) WITH ORDINALITY AS t(elem, ordinality)
)
WHERE etapes IS NOT NULL 
  AND array_length(etapes, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(etapes) AS e 
    WHERE (e->>'address_id') LIKE '{%'
  );

-- Verify the fix
SELECT id, reference, etapes 
FROM prestation 
WHERE etapes IS NOT NULL 
LIMIT 5;
