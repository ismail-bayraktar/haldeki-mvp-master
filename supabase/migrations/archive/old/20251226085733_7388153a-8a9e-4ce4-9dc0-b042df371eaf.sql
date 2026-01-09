-- Dealers için orders SELECT policy (region_id kontrolü)
CREATE POLICY "Dealers can view orders in assigned regions"
ON public.orders FOR SELECT
TO authenticated
USING (
  region_id IN (
    SELECT UNNEST(region_ids) 
    FROM public.dealers 
    WHERE user_id = auth.uid()
  )
);