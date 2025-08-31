-- Corrigir políticas de segurança para garantir que apenas gerentes ativos possam acessar dados
-- Esta migração corrige a falha de segurança que permitia gerentes inativos fazerem login

-- Primeiro, remover as políticas permissivas existentes
DROP POLICY IF EXISTS "Authenticated users can view managers" ON public.managers;
DROP POLICY IF EXISTS "Authenticated users can insert managers" ON public.managers;
DROP POLICY IF EXISTS "Authenticated users can update managers" ON public.managers;
DROP POLICY IF EXISTS "Authenticated users can delete managers" ON public.managers;

DROP POLICY IF EXISTS "Authenticated users can view waiters" ON public.waiters;
DROP POLICY IF EXISTS "Authenticated users can insert waiters" ON public.waiters;
DROP POLICY IF EXISTS "Authenticated users can update waiters" ON public.waiters;
DROP POLICY IF EXISTS "Authenticated users can delete waiters" ON public.waiters;

DROP POLICY IF EXISTS "Authenticated users can view comp types" ON public.comp_types;
DROP POLICY IF EXISTS "Authenticated users can insert comp types" ON public.comp_types;
DROP POLICY IF EXISTS "Authenticated users can update comp types" ON public.comp_types;
DROP POLICY IF EXISTS "Authenticated users can delete comp types" ON public.comp_types;

DROP POLICY IF EXISTS "Authenticated users can view comps" ON public.comps;
DROP POLICY IF EXISTS "Authenticated users can insert comps" ON public.comps;
DROP POLICY IF EXISTS "Authenticated users can update comps" ON public.comps;
DROP POLICY IF EXISTS "Authenticated users can delete comps" ON public.comps;

DROP POLICY IF EXISTS "Authenticated users can view closings" ON public.closings;
DROP POLICY IF EXISTS "Authenticated users can insert closings" ON public.closings;
DROP POLICY IF EXISTS "Authenticated users can update closings" ON public.closings;
DROP POLICY IF EXISTS "Authenticated users can delete closings" ON public.closings;

DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

-- Criar função de verificação de gerente ativo
CREATE OR REPLACE FUNCTION public.is_active_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.managers 
    WHERE usuario = auth.jwt() ->> 'email' 
    AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar novas políticas restritivas para managers
CREATE POLICY "Only active managers can view managers" ON public.managers 
FOR SELECT TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can insert managers" ON public.managers 
FOR INSERT TO authenticated 
WITH CHECK (public.is_active_manager());

CREATE POLICY "Only active managers can update managers" ON public.managers 
FOR UPDATE TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can delete managers" ON public.managers 
FOR DELETE TO authenticated 
USING (public.is_active_manager());

-- Criar novas políticas restritivas para waiters
CREATE POLICY "Only active managers can view waiters" ON public.waiters 
FOR SELECT TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can insert waiters" ON public.waiters 
FOR INSERT TO authenticated 
WITH CHECK (public.is_active_manager());

CREATE POLICY "Only active managers can update waiters" ON public.waiters 
FOR UPDATE TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can delete waiters" ON public.waiters 
FOR DELETE TO authenticated 
USING (public.is_active_manager());

-- Criar novas políticas restritivas para comp_types
CREATE POLICY "Only active managers can view comp types" ON public.comp_types 
FOR SELECT TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can insert comp types" ON public.comp_types 
FOR INSERT TO authenticated 
WITH CHECK (public.is_active_manager());

CREATE POLICY "Only active managers can update comp types" ON public.comp_types 
FOR UPDATE TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can delete comp types" ON public.comp_types 
FOR DELETE TO authenticated 
USING (public.is_active_manager());

-- Criar novas políticas restritivas para comps
CREATE POLICY "Only active managers can view comps" ON public.comps 
FOR SELECT TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can insert comps" ON public.comps 
FOR INSERT TO authenticated 
WITH CHECK (public.is_active_manager());

CREATE POLICY "Only active managers can update comps" ON public.comps 
FOR UPDATE TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can delete comps" ON public.comps 
FOR DELETE TO authenticated 
USING (public.is_active_manager());

-- Criar novas políticas restritivas para closings
CREATE POLICY "Only active managers can view closings" ON public.closings 
FOR SELECT TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can insert closings" ON public.closings 
FOR INSERT TO authenticated 
WITH CHECK (public.is_active_manager());

CREATE POLICY "Only active managers can update closings" ON public.closings 
FOR UPDATE TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can delete closings" ON public.closings 
FOR DELETE TO authenticated 
USING (public.is_active_manager());

-- Criar novas políticas restritivas para audit_logs
CREATE POLICY "Only active managers can view audit logs" ON public.audit_logs 
FOR SELECT TO authenticated 
USING (public.is_active_manager());

CREATE POLICY "Only active managers can insert audit logs" ON public.audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (public.is_active_manager());

-- Criar novas políticas restritivas para settings
CREATE POLICY "Only active managers can view their own settings" ON public.settings 
FOR SELECT TO authenticated 
USING (
  public.is_active_manager() AND 
  auth.uid() = user_id
);

CREATE POLICY "Only active managers can create their own settings" ON public.settings 
FOR INSERT TO authenticated 
WITH CHECK (
  public.is_active_manager() AND 
  auth.uid() = user_id
);

CREATE POLICY "Only active managers can update their own settings" ON public.settings 
FOR UPDATE TO authenticated 
USING (
  public.is_active_manager() AND 
  auth.uid() = user_id
);

CREATE POLICY "Only active managers can delete their own settings" ON public.settings 
FOR DELETE TO authenticated 
USING (
  public.is_active_manager() AND 
  auth.uid() = user_id
);

-- Manter a política de profiles como está (usuários só veem seu próprio perfil)
-- Mas adicionar verificação de gerente ativo
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Only active managers can view their own profile" ON public.profiles 
FOR SELECT TO authenticated 
USING (
  public.is_active_manager() AND 
  auth.uid() = id
);

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.is_active_manager() IS 'Função de segurança que verifica se o usuário autenticado é um gerente ativo na tabela managers';


