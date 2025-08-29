-- Adicionar alguns dados iniciais à tabela managers
INSERT INTO public.managers (nome, usuario, senha, tipo_acesso, ativo) VALUES
('Gerente Principal', 'admin', '123456', 'qualquer_ip', true),
('Supervisor', 'supervisor', '123456', 'qualquer_ip', true),
('Gerente Noturno', 'noturno', '123456', 'qualquer_ip', true)
ON CONFLICT DO NOTHING;