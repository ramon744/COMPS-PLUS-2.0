-- Adicionar foreign keys faltantes nas tabelas

-- Primeiro, vamos verificar se as foreign keys já existem
-- Se não existirem, adicionar foreign keys para a tabela comps
DO $$
BEGIN
    -- Foreign key para comp_types
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'comps' AND constraint_name = 'fk_comps_comp_type'
    ) THEN
        ALTER TABLE public.comps 
        ADD CONSTRAINT fk_comps_comp_type 
        FOREIGN KEY (comp_type_id) REFERENCES public.comp_types(id);
    END IF;

    -- Foreign key para waiters
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'comps' AND constraint_name = 'fk_comps_waiter'
    ) THEN
        ALTER TABLE public.comps 
        ADD CONSTRAINT fk_comps_waiter 
        FOREIGN KEY (waiter_id) REFERENCES public.waiters(id);
    END IF;

    -- Foreign key para profiles (gerente)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'comps' AND constraint_name = 'fk_comps_gerente'
    ) THEN
        ALTER TABLE public.comps 
        ADD CONSTRAINT fk_comps_gerente 
        FOREIGN KEY (gerente_id) REFERENCES public.profiles(id);
    END IF;
END $$;