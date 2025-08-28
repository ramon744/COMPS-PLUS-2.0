-- Remove duplicate foreign key constraint
ALTER TABLE public.comps DROP CONSTRAINT IF EXISTS comps_comp_type_id_fkey;
ALTER TABLE public.comps DROP CONSTRAINT IF EXISTS comps_waiter_id_fkey; 
ALTER TABLE public.comps DROP CONSTRAINT IF EXISTS comps_gerente_id_fkey;