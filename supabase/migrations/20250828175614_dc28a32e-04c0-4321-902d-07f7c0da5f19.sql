-- Create enum types
CREATE TYPE public.user_role AS ENUM ('manager_day', 'manager_night', 'admin');
CREATE TYPE public.access_type AS ENUM ('qualquer_ip', 'ip_especifico');
CREATE TYPE public.shift_type AS ENUM ('manha', 'noite');
CREATE TYPE public.comp_status AS ENUM ('ativo', 'cancelado');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  role user_role NOT NULL DEFAULT 'manager_day',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create managers table
CREATE TABLE public.managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  tipo_acesso access_type NOT NULL DEFAULT 'qualquer_ip',
  ip_permitido TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create waiters table
CREATE TABLE public.waiters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  matricula TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comp_types table
CREATE TABLE public.comp_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comps table
CREATE TABLE public.comps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comp_type_id UUID NOT NULL REFERENCES public.comp_types(id),
  waiter_id UUID NOT NULL REFERENCES public.waiters(id),
  valor_centavos INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  foto_url TEXT,
  data_hora_local TIMESTAMP WITH TIME ZONE NOT NULL,
  data_hora_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  dia_operacional DATE NOT NULL,
  turno shift_type NOT NULL,
  gerente_id UUID NOT NULL REFERENCES auth.users(id),
  status comp_status NOT NULL DEFAULT 'ativo',
  cancelado_motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create closings table
CREATE TABLE public.closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_operacional DATE NOT NULL,
  periodo_inicio_local TIMESTAMP WITH TIME ZONE NOT NULL,
  periodo_fim_local TIMESTAMP WITH TIME ZONE NOT NULL,
  total_valor_centavos INTEGER NOT NULL,
  total_qtd INTEGER NOT NULL,
  fechado_por UUID NOT NULL REFERENCES auth.users(id),
  fechado_em_local TIMESTAMP WITH TIME ZONE NOT NULL,
  enviado_para TEXT[] NOT NULL DEFAULT '{}',
  url_pdf TEXT,
  url_csv TEXT,
  versao INTEGER NOT NULL DEFAULT 1,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  payload_resumo TEXT NOT NULL,
  created_em_local TIMESTAMP WITH TIME ZONE NOT NULL,
  created_em_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for managers (admin only)
CREATE POLICY "Authenticated users can view managers" ON public.managers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert managers" ON public.managers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update managers" ON public.managers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete managers" ON public.managers FOR DELETE TO authenticated USING (true);

-- RLS Policies for waiters (authenticated users)
CREATE POLICY "Authenticated users can view waiters" ON public.waiters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert waiters" ON public.waiters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update waiters" ON public.waiters FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete waiters" ON public.waiters FOR DELETE TO authenticated USING (true);

-- RLS Policies for comp_types (authenticated users)
CREATE POLICY "Authenticated users can view comp types" ON public.comp_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comp types" ON public.comp_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update comp types" ON public.comp_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete comp types" ON public.comp_types FOR DELETE TO authenticated USING (true);

-- RLS Policies for comps (authenticated users)
CREATE POLICY "Authenticated users can view comps" ON public.comps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comps" ON public.comps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update comps" ON public.comps FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete comps" ON public.comps FOR DELETE TO authenticated USING (true);

-- RLS Policies for closings (authenticated users)
CREATE POLICY "Authenticated users can view closings" ON public.closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert closings" ON public.closings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update closings" ON public.closings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete closings" ON public.closings FOR DELETE TO authenticated USING (true);

-- RLS Policies for audit_logs (authenticated users)
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_managers_updated_at BEFORE UPDATE ON public.managers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_waiters_updated_at BEFORE UPDATE ON public.waiters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comp_types_updated_at BEFORE UPDATE ON public.comp_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comps_updated_at BEFORE UPDATE ON public.comps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_closings_updated_at BEFORE UPDATE ON public.closings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'manager_day'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some initial data
INSERT INTO public.comp_types (codigo, nome, descricao) VALUES
  ('CORTESIA', 'Cortesia', 'Cortesia oferecida ao cliente'),
  ('ERRO_COZINHA', 'Erro da Cozinha', 'Erro na preparação do pedido'),
  ('ERRO_GARCOM', 'Erro do Garçom', 'Erro do garçom no atendimento'),
  ('PROMOCAO', 'Promoção', 'Desconto promocional'),
  ('CLIENTE_VIP', 'Cliente VIP', 'Cortesia para cliente especial');

INSERT INTO public.waiters (nome, matricula) VALUES
  ('João Silva', '001'),
  ('Maria Santos', '002'),
  ('Pedro Oliveira', '003'),
  ('Ana Costa', '004'),
  ('Carlos Mendes', '005');