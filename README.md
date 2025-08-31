# Comps Plus 54 - Sistema de Gestão de COMPs

Sistema completo para gestão de COMPs (Comprovantes de Pagamento) com autenticação, relatórios e monitoramento em tempo real.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Node.js 18+ instalado

### Passos para Deploy

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd comps-plus-54
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   - Crie arquivo `.env.local` com suas credenciais do Supabase
   - Ou configure diretamente na Vercel

4. **Deploy na Vercel**
   ```bash
   npm run build
   npx vercel --prod
   ```

   Ou conecte seu repositório GitHub na Vercel para deploy automático.

### Variáveis de Ambiente na Vercel

Configure estas variáveis no painel da Vercel:

- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `VITE_APP_ENV`: production
- `VITE_APP_VERSION`: 1.0.0

### Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── contexts/      # Contextos React (Auth, Comps, Registry)
├── hooks/         # Hooks personalizados
├── integrations/  # Integrações externas (Supabase)
├── pages/         # Páginas da aplicação
├── types/         # Definições TypeScript
└── utils/         # Utilitários
```

### Scripts Disponíveis

- `npm run dev`: Desenvolvimento local
- `npm run build`: Build de produção
- `npm run preview`: Preview do build
- `npm run lint`: Verificação de código
- `npm run type-check`: Verificação de tipos TypeScript

### Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deploy**: Vercel

### Funcionalidades

- ✅ Autenticação de gerentes
- ✅ Gestão de COMPs em tempo real
- ✅ Relatórios e dashboards
- ✅ Gestão de waiters e tipos de COMP
- ✅ Fechamento operacional
- ✅ Sistema de notificações
- ✅ Monitoramento de espaço no banco

### Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.
