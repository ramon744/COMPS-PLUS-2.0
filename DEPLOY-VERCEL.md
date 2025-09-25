# 🚀 Deploy na Vercel - COMPS-PLUS-2.0

## 📋 Pré-requisitos

1. **Conta na Vercel** (gratuita)
2. **Repositório GitHub** configurado
3. **Conta Supabase** com projeto criado
4. **Google Apps Script** configurado

## 🔧 Passo a Passo

### 1. Conectar Repositório à Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**
4. Selecione o repositório **"COMPS-PLUS-2.0"**
5. Clique em **"Import"**

### 2. Configurar Variáveis de Ambiente

Na Vercel, vá em **Settings > Environment Variables** e adicione:

```env
VITE_SUPABASE_URL=https://hivxzwvqzfelhbijiuzm.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwZMzPRK19A07IiESRd_qe_yt0QFLsXql9dZ5PhlO3qsCLf0O5NIKNqRCnNb_pazCAbhQ/exec
```

### 3. Configurar Build Settings

Na Vercel, configure:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy Automático

Após a configuração:
1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Acesse a URL fornecida

## 🔐 Configurações de Segurança

### Supabase RLS (Row Level Security)

Execute as migrações no Supabase:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE perda_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
```

### Google Apps Script

1. **Publique como aplicação web**:
   - Executar como: "Eu"
   - Quem tem acesso: "Qualquer pessoa"

2. **Configure as variáveis** no script:
   ```javascript
   const SUPABASE_URL = 'https://hivxzwvqzfelhbijiuzm.supabase.co';
   const SUPABASE_ANON_KEY = 'sua_chave_anonima';
   ```

## 📧 Configuração de Emails

### Resend API

1. Crie conta em [resend.com](https://resend.com)
2. Configure o domínio `girosaas.com.br`
3. Adicione a chave API no Supabase Edge Functions

### Edge Function: enviar-email-zoho

```javascript
// Supabase Edge Function
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req) {
  // Lógica de envio de email
}
```

## 🧪 Testes Pós-Deploy

### 1. Teste de Autenticação
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Recuperação de senha funciona

### 2. Teste de Comps
- [ ] Registro de comps funciona
- [ ] Fechamento funciona
- [ ] Planilha é atualizada

### 3. Teste de Perdas de Serviço
- [ ] Registro de perdas funciona
- [ ] Relatórios funcionam
- [ ] Filtros funcionam

### 4. Teste de Notificações
- [ ] Notificações aparecem
- [ ] PDF é gerado
- [ ] Email é enviado

### 5. Teste de Limpeza
- [ ] Trigger é criado
- [ ] Limpeza é executada
- [ ] Trigger é auto-excluído

## 🔍 Monitoramento

### Logs da Vercel
- Acesse o dashboard da Vercel
- Vá em **Functions > Logs**
- Monitore erros e performance

### Logs do Supabase
- Acesse o dashboard do Supabase
- Vá em **Logs**
- Monitore queries e erros

### Logs do Google Apps Script
- Acesse o Google Apps Script
- Vá em **Execuções**
- Monitore execuções e erros

## 🚨 Solução de Problemas

### Erro 500 - Internal Server Error
1. Verifique as variáveis de ambiente
2. Confirme as URLs do Supabase
3. Verifique as permissões do GAS

### Emails não enviados
1. Verifique a configuração do Resend
2. Confirme o domínio verificado
3. Verifique os logs do Edge Function

### Planilha não atualiza
1. Verifique as permissões do GAS
2. Confirme a URL do script
3. Teste manualmente no GAS

### Notificações não aparecem
1. Verifique o RLS do Supabase
2. Confirme as políticas de segurança
3. Teste a conexão com o banco

## 📊 Performance

### Otimizações Implementadas
- ✅ Lazy loading de componentes
- ✅ Memoização de cálculos
- ✅ Debounce em inputs
- ✅ Paginação em listas
- ✅ Cache de dados

### Métricas Esperadas
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

## 🔄 Atualizações

### Deploy Automático
- Push para `main` → Deploy automático
- Push para `develop` → Deploy de preview
- Pull requests → Deploy de preview

### Rollback
- Acesse o dashboard da Vercel
- Vá em **Deployments**
- Clique em **"Promote to Production"**

## 📞 Suporte

Para problemas técnicos:
1. Verifique os logs
2. Teste em ambiente local
3. Confirme as configurações
4. Entre em contato com o suporte

## ✅ Checklist Final

- [ ] Repositório conectado à Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] URL de produção funcionando
- [ ] Autenticação funcionando
- [ ] Comps funcionando
- [ ] Perdas de serviço funcionando
- [ ] Notificações funcionando
- [ ] Emails funcionando
- [ ] Limpeza automática funcionando

## 🎉 Deploy Concluído!

Seu sistema está pronto para produção! 🚀
