# Teste Manual de Notificações

## Problema Identificado

As notificações não estão aparecendo no sininho. Vamos diagnosticar e resolver o problema passo a passo.

## Passos para Diagnóstico

### 1. **Verificar se a Tabela Existe**

Acesse o Supabase Dashboard e execute:

```sql
-- Verificar se a tabela notifications existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';
```

### 2. **Criar a Tabela se Não Existir**

Se a tabela não existir, execute:

```sql
-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closing_id UUID REFERENCES public.closings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf_ready', 'error', 'info')),
  read BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
```

### 3. **Testar Inserção Manual**

Execute no Supabase SQL Editor:

```sql
-- Inserir notificação de teste
INSERT INTO public.notifications (
  user_id,
  closing_id,
  title,
  message,
  type,
  pdf_url
) VALUES (
  'SEU_USER_ID_AQUI', -- Substitua pelo ID do usuário logado
  NULL,
  'Teste de Notificação',
  'Esta é uma notificação de teste para verificar se o sistema está funcionando.',
  'info',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
);
```

### 4. **Verificar se o Usuário Está Logado**

No console do navegador, execute:

```javascript
// Verificar se o usuário está logado
console.log('Usuário logado:', window.supabase?.auth?.getUser());
```

### 5. **Testar o Hook de Notificações**

No console do navegador, execute:

```javascript
// Testar se o contexto está funcionando
const { useNotifications } = window.React?.useContext;
console.log('Hook de notificações:', useNotifications);
```

## Soluções Implementadas

### 1. **Botão de Teste na Interface**

Adicionei um botão "Testar Notificação" na aba Configurações → Testes que:
- Usa o hook `useNotifications`
- Insere uma notificação de teste
- Inclui PDF de exemplo

### 2. **Arquivo de Teste HTML**

Criei `test-notification-simple.html` que:
- Testa a conexão com Supabase
- Verifica se a tabela existe
- Insere notificação de teste
- Mostra resultados na tela

### 3. **Logs de Debug**

Adicionei logs no contexto de notificações:
- `console.log('🔔 Nova notificação recebida:', payload.new)`
- Logs de erro para debugging

## Como Testar

### **Método 1: Interface do Aplicativo**
1. Acesse http://localhost:8080
2. Vá para Configurações → Testes
3. Clique em "Testar Notificação"
4. Verifique se aparece no sininho

### **Método 2: Arquivo HTML**
1. Abra `test-notification-simple.html` no navegador
2. Clique em "Testar Notificação"
3. Verifique os resultados na tela

### **Método 3: Supabase Dashboard**
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute as queries de teste
4. Verifique se a notificação foi inserida

## Possíveis Causas

### 1. **Tabela Não Existe**
- A migração não foi aplicada
- RLS não está configurado

### 2. **Usuário Não Logado**
- Contexto de autenticação não está funcionando
- Token expirado

### 3. **RLS Bloqueando**
- Políticas de RLS muito restritivas
- Usuário não tem permissão

### 4. **Realtime Não Funcionando**
- Supabase Realtime não está ativo
- Subscription não está funcionando

## Próximos Passos

1. **Verificar se a tabela existe** no Supabase
2. **Testar inserção manual** de notificação
3. **Verificar logs do console** para erros
4. **Testar o botão** na interface
5. **Configurar RLS** se necessário

## Comandos Úteis

```bash
# Verificar se o servidor está rodando
netstat -an | findstr :8080

# Reiniciar o servidor
npm run dev

# Verificar logs do navegador
F12 → Console
```
