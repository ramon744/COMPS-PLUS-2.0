# Variáveis de Ambiente

## Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do projeto com:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Deploy na Vercel

Configure as seguintes variáveis de ambiente no painel da Vercel:

1. `VITE_SUPABASE_URL` - URL do seu projeto Supabase
2. `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase

### Como configurar na Vercel:

1. Acesse o dashboard da Vercel
2. Vá para o seu projeto
3. Clique em "Settings"
4. Vá para "Environment Variables"
5. Adicione as variáveis acima

## Onde encontrar as credenciais do Supabase:

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para "Settings" > "API"
4. Copie a "URL" e a "anon public" key
