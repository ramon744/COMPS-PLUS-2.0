-- Create trigger for new user profile creation  
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial comp types data
INSERT INTO public.comp_types (codigo, nome, descricao, ativo) VALUES
('COMPS 2', 'Produto com defeito', 'Produto apresentou defeito', true),
('COMPS 4', 'Atraso no pedido', 'Pedido demorou mais que o esperado', true),
('COMPS 8', 'Erro no pedido', 'Pedido foi preparado incorretamente', true),
('COMPS 11', 'Atendimento ruim', 'Atendimento não foi satisfatório', true),
('COMPS 12', 'Produto faltando', 'Produto não estava disponível', true),
('COMPS 13', 'Reclamação geral', 'Reclamação sobre o serviço', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insert initial waiters data
INSERT INTO public.waiters (nome, matricula, ativo) VALUES
('Maria Silva', '001', true),
('João Santos', '002', true),
('Ana Costa', '003', true),
('Pedro Oliveira', '004', true),
('Lucia Fernandes', '005', true)
ON CONFLICT (matricula) DO NOTHING;