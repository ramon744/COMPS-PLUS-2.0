-- Adicionar trigger para updated_at na tabela managers se não existir
CREATE TRIGGER update_managers_updated_at
    BEFORE UPDATE ON public.managers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();