-- Add foreign key constraints to comps table
ALTER TABLE public.comps 
ADD CONSTRAINT fk_comps_comp_type 
FOREIGN KEY (comp_type_id) REFERENCES public.comp_types(id);

ALTER TABLE public.comps 
ADD CONSTRAINT fk_comps_waiter 
FOREIGN KEY (waiter_id) REFERENCES public.waiters(id);

ALTER TABLE public.comps 
ADD CONSTRAINT fk_comps_gerente 
FOREIGN KEY (gerente_id) REFERENCES public.profiles(id);

-- Add foreign key constraint to managers table
ALTER TABLE public.managers 
ADD CONSTRAINT fk_managers_profile 
FOREIGN KEY (id) REFERENCES public.profiles(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comps_comp_type_id ON public.comps(comp_type_id);
CREATE INDEX IF NOT EXISTS idx_comps_waiter_id ON public.comps(waiter_id);
CREATE INDEX IF NOT EXISTS idx_comps_gerente_id ON public.comps(gerente_id);
CREATE INDEX IF NOT EXISTS idx_comps_dia_operacional ON public.comps(dia_operacional);