# Debug: API Key Inválida - Guia de Diagnóstico

## 🔍 Problema Atual
Erro: "invalid api key" no Supabase em produção

## ✅ Verificações Realizadas

### 1. Credenciais Verificadas via MCP
- ✅ **Projeto existe:** `hivxzwvqzfelhbijiuzm`
- ✅ **Status:** `ACTIVE_HEALTHY`
- ✅ **URL:** `https://hivxzwvqzfelhbijiuzm.supabase.co`
- ✅ **Chave anônima:** Verificada e válida

### 2. Configuração do Cliente
- ✅ **Arquivo correto:** `src/integrations/supabase/client.ts`
- ✅ **Variável esperada:** `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ **Logs adicionados:** Para debug em produção

### 3. Repositório
- ✅ **Repositório correto:** `https://github.com/ramon744/COMPS-PLUS-2.0.git`
- ✅ **Deploy automático:** Configurado no Vercel

## 🔧 Melhorias Implementadas

### Logs de Debug Adicionados
```typescript
// Validação robusta de variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente Supabase...');
console.log('VITE_SUPABASE_URL:', SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada');
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', SUPABASE_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ Não configurada');
```

### Validação de Formato
```typescript
// Validar formato das variáveis
if (!SUPABASE_URL.startsWith('https://')) {
  throw new Error('VITE_SUPABASE_URL deve começar com https://');
}

if (!SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY deve ser um JWT válido');
}
```

### Teste de Conexão
```typescript
// Teste de conexão em todos os ambientes
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Erro na conexão Supabase:', error.message);
    console.error('❌ Detalhes do erro:', error);
  } else {
    console.log('✅ Conexão com Supabase estabelecida');
  }
});
```

## 🚨 Próximos Passos para Debug

### 1. Verificar Console do Navegador
Após o deploy, abra o console do navegador e procure por:
- `🔍 Verificando variáveis de ambiente Supabase...`
- `✅ Variáveis de ambiente validadas com sucesso`
- `✅ Conexão com Supabase estabelecida`

### 2. Se as Variáveis Não Aparecem
**Problema:** Variáveis não configuradas no Vercel
**Solução:** 
1. Acesse Vercel Dashboard
2. Vá para o projeto
3. Settings → Environment Variables
4. Adicione as variáveis do arquivo `VERCEL_ENV_VARS.md`

### 3. Se as Variáveis Aparecem mas Conexão Falha
**Problema:** Chave inválida ou expirada
**Solução:**
1. Regenerar chave no Supabase Dashboard
2. Atualizar no Vercel
3. Fazer novo deploy

### 4. Se Tudo Parece Correto
**Problema:** Cache ou configuração do Vercel
**Solução:**
1. Limpar cache do navegador
2. Forçar novo deploy no Vercel
3. Verificar configurações de build

## 📋 Variáveis de Ambiente Corretas

```env
VITE_SUPABASE_URL=https://hivxzwvqzfelhbijiuzm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpdnh6d3ZxemZlbGhiaWppdXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDU1MjQsImV4cCI6MjA3MzkyMTUyNH0.5lU7K9ZJP-KE7668a4Guf3iiHhEHF-XjXQnhoz5bxfI
```

## 🎯 Status
- **Credenciais:** ✅ Verificadas via MCP
- **Código:** ✅ Logs de debug adicionados
- **Deploy:** 🔄 Aguardando novo deploy
- **Teste:** ⏳ Aguardando feedback do console
