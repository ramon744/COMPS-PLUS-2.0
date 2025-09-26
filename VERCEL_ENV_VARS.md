# Variáveis de Ambiente para Vercel

Para que a aplicação funcione corretamente no Vercel, configure as seguintes variáveis de ambiente:

## Configuração do Supabase (✅ VERIFICADO VIA MCP)
```
VITE_SUPABASE_URL=https://hivxzwvqzfelhbijiuzm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpdnh6d3ZxemZlbGhiaWppdXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDU1MjQsImV4cCI6MjA3MzkyMTUyNH0.5lU7K9ZJP-KE7668a4Guf3iiHhEHF-XjXQnhoz5bxfI
```

**Status do Projeto:** ✅ ACTIVE_HEALTHY  
**Região:** sa-east-1 (São Paulo)  
**Nome:** comps desenvolvimento

## Configuração da Aplicação
```
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

## Configuração do Webhook (opcional)
```
VITE_WEBHOOK_URL=https://your-webhook-url.com/webhook
VITE_WEBHOOK_ACTIVE=false
```

## Como configurar no Vercel:

1. Acesse o dashboard do Vercel
2. Vá para o projeto
3. Clique em "Settings"
4. Clique em "Environment Variables"
5. Adicione cada variável acima

**IMPORTANTE:** Certifique-se de que todas as variáveis estão configuradas corretamente no Vercel para evitar a tela branca.
