# Correção do Erro de UUID no Webhook

## Problema Identificado

O erro estava ocorrendo porque o N8N estava tentando usar o `closing_id` de teste (string como "test-report-1757575914277") em operações que esperam um UUID válido no Supabase.

**Erro original:**
```json
{
  "errorMessage": "The service was not able to process your request",
  "errorDescription": "Erro ao atualizar registro de fechamento",
  "errorDetails": {
    "rawErrorMessage": [
      "500 - \"{\\\"error\\\":\\\"Erro ao atualizar registro de fechamento\\\",\\\"details\\\":\\\"invalid input syntax for type uuid: \\\\\\\"test-report-1757575914277\\\\\\\"\\\"}\""
    ],
    "httpCode": "500"
  }
}
```

## Soluções Implementadas

### 1. **Geração de UUIDs Válidos para Testes**

**Antes:**
```typescript
const testClosingId = "test-report-" + Date.now();
```

**Depois:**
```typescript
const generateTestUUID = () => {
  return crypto.randomUUID();
};

const testClosingId = generateTestUUID();
```

### 2. **Funções do Supabase Atualizadas**

As funções `notify_pdf_ready` e `notify_processing_error` foram atualizadas para:

- Aceitar `TEXT` em vez de `UUID` para o parâmetro `closing_id`
- Detectar automaticamente se é um ID de teste ou produção
- Tratar IDs de teste de forma especial (não buscar no banco)
- Criar notificações apropriadas para cada caso

### 3. **Fluxo de Teste vs Produção**

#### **Teste:**
- Gera UUID válido usando `crypto.randomUUID()`
- Função do Supabase detecta que é teste
- Cria notificação com `closing_id = NULL`
- Título inclui "(TESTE)" para identificação

#### **Produção:**
- Usa UUID real do banco de dados
- Função do Supabase busca dados do fechamento
- Cria notificação com `closing_id` válido
- Título normal sem indicação de teste

## Configuração do N8N

O N8N deve ser configurado para:

1. **Receber o `closing_id`** nos dados do webhook
2. **Chamar a função do Supabase** com o ID recebido:

```javascript
// Exemplo de chamada para notificar PDF pronto
const response = await fetch('https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_pdf_ready', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'apikey': 'YOUR_SUPABASE_ANON_KEY'
  },
  body: JSON.stringify({
    p_closing_id: closing_id, // UUID válido ou string de teste
    p_pdf_url: 'https://exemplo.com/relatorio.pdf'
  })
});
```

## Testes Disponíveis

### 1. **Teste Completo**
- Envia funcionários + relatório
- Usa UUID válido para `closing_id`
- Simula fluxo completo de produção

### 2. **Teste de Funcionários**
- Envia apenas dados dos funcionários
- Não inclui `closing_id` (não necessário)

### 3. **Teste de Relatório**
- Envia apenas dados do relatório
- Usa UUID válido para `closing_id`
- Testa notificações

## Validação

Para validar se a correção funcionou:

1. **Execute um teste** na aba Configurações → Testes
2. **Verifique os logs** do N8N (não deve mais ter erro de UUID)
3. **Confirme as notificações** no sininho (se configurado)
4. **Teste em produção** com fechamento real

## Benefícios

- ✅ **Testes funcionam** sem erros de UUID
- ✅ **Produção mantida** com UUIDs reais
- ✅ **Notificações funcionam** para ambos os casos
- ✅ **Compatibilidade total** com N8N existente
- ✅ **Debug facilitado** com identificação de testes
