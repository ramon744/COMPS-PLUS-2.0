# 🍽️ Comps Plus 54 - Sistema de Gestão de COMPS

Sistema completo para gestão de COMPS (complementos) de funcionários em restaurantes, com relatórios automatizados e notificações em tempo real.

## 🚀 Funcionalidades

### 📊 **Gestão de COMPS**
- Cadastro e edição de COMPS por funcionário
- Categorização por tipo (2, 4, 8, 10, 12, 13)
- Validação de valores e limites
- Histórico completo de transações

### 👥 **Gestão de Funcionários**
- Cadastro de garçons e gerentes
- Controle de status ativo/inativo
- Ranking de performance
- Relatórios individuais

### 📈 **Relatórios e Analytics**
- Relatórios diários automáticos
- Gráficos de performance
- Exportação em PDF e CSV
- Histórico de fechamentos

### 🔔 **Sistema de Notificações**
- Notificações em tempo real
- PDFs de relatórios automáticos
- Integração com N8N
- Visualização inline de documentos

### 🔐 **Segurança**
- Autenticação via Supabase
- Controle de acesso por gerente
- Políticas RLS (Row Level Security)
- Logout automático por inatividade

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Notificações**: Supabase Realtime
- **Deploy**: Vercel
- **Automação**: N8N (webhooks)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/comps-plus-54.git
cd comps-plus-54
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### 4. Execute o projeto
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🗄️ Configuração do Banco de Dados

### 1. Execute as migrações
```bash
# No Supabase Dashboard, execute as migrações em ordem:
supabase/migrations/
├── 20250129000000_add_global_settings.sql
├── 20250129000001_migrate_webhook_settings.sql
├── 20250130000001_create_notifications_table.sql
├── 20250130000002_fix_notifications_policies.sql
└── 20250829080000_fix_security_policies.sql
```

### 2. Configure as políticas RLS
As políticas de segurança estão configuradas nas migrações para garantir que apenas gerentes ativos tenham acesso aos dados.

## 🔧 Configuração do N8N

### 1. Webhook de Recebimento
Configure um webhook no N8N para receber dados de fechamento:
- **URL**: `https://seu-projeto.supabase.co/functions/v1/webhook-pdf`
- **Método**: POST
- **Dados**: `closing_id`, `pdf_data` (base64)

### 2. Processamento de PDF
Após processar o PDF, o N8N deve chamar:
- **URL**: `https://seu-projeto.supabase.co/rest/v1/rpc/notify_pdf_ready`
- **Método**: POST
- **Body**: `{ "p_closing_id": "uuid", "p_pdf_url": "url" }`

## 🚀 Deploy na Vercel

### 1. Conecte o repositório
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Importe o repositório do GitHub
3. Configure as variáveis de ambiente

### 2. Variáveis de ambiente na Vercel
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### 3. Deploy automático
O deploy é automático a cada push para a branch `main`.

## 📱 Uso do Sistema

### 1. **Login**
- Acesse a aplicação
- Faça login com suas credenciais
- O sistema verifica se você é um gerente ativo

### 2. **Cadastrar COMPS**
- Vá para a página principal
- Selecione o funcionário
- Preencha os dados do COMP
- Salve a transação

### 3. **Fechamento Diário**
- Acesse "Fechamento"
- Preencha os gerentes (manhã/noite)
- Confirme o fechamento
- O sistema gera relatório automaticamente

### 4. **Visualizar Relatórios**
- Acesse "Relatórios"
- Configure filtros de data
- Visualize gráficos e tabelas
- Exporte em PDF ou CSV

## 🔒 Segurança

### Políticas Implementadas
- ✅ Autenticação obrigatória
- ✅ Verificação de gerente ativo
- ✅ Políticas RLS no banco
- ✅ Logout automático por inatividade
- ✅ Validação de dados no frontend

### Controle de Acesso
- Apenas gerentes ativos podem acessar o sistema
- Dados isolados por usuário
- Sessões seguras com refresh automático

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. **Erro de Login**
- Verifique se o email está na tabela `managers`
- Confirme se o gerente está ativo
- Verifique as credenciais do Supabase

#### 2. **Notificações não aparecem**
- Verifique se o Realtime está ativo
- Confirme se o N8N está chamando a função RPC
- Verifique os logs do console

#### 3. **PDF não é gerado**
- Verifique se o N8N está configurado
- Confirme se o webhook está funcionando
- Verifique os logs da Edge Function

## 📊 Monitoramento

### Logs Importantes
- Console do navegador para erros de frontend
- Logs do Supabase para erros de backend
- Logs do N8N para automação

### Métricas
- Número de COMPS por dia
- Performance dos funcionários
- Tempo de resposta do sistema

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no GitHub
- Entre em contato via email
- Consulte a documentação do Supabase

---

**Desenvolvido com ❤️ para restaurantes que valorizam a gestão eficiente de COMPS**