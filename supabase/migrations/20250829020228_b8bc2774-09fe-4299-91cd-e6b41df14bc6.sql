-- Adicionar alguns dados iniciais à tabela managers (sem senhas hardcoded)
INSERT INTO public.managers (nome, usuario, senha, tipo_acesso, ativo) VALUES
('Gerente Principal', 'admin', crypt('admin123', gen_salt('bf')), 'qualquer_ip', true),
('Supervisor', 'supervisor', crypt('super123', gen_salt('bf')), 'qualquer_ip', true),
('Gerente Noturno', 'noturno', crypt('noturno123', gen_salt('bf')), 'qualquer_ip', true)
ON CONFLICT DO NOTHING;