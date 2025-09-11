# Sistema de Notificações com ID de Fechamento

## Visão Geral

O sistema foi implementado para incluir o ID de fechamento nos dados enviados para o webhook e notificar os gerentes quando o PDF estiver disponível.

## Funcionalidades Implementadas

### 1. ID de Fechamento no Webhook

- **Arquivo modificado**: `src/pages/Closing.tsx`
- **Funcionalidade**: O sistema agora captura o ID do fechamento após inserir no banco de dados e inclui no webhook
- **Campo adicionado**: `closing_id` nos dados enviados para o N8N

### 2. Sistema de Notificações

- **Contexto**: `src/contexts/NotificationContext.tsx`
- **Componente**: `src/components/NotificationBell.tsx`
- **Tabela**: `notifications` no Supabase
- **Funcionalidades**:
  - Sininho no header com contador de notificações não lidas
  - Notificações em tempo real via Supabase Realtime
  - Diferentes tipos de notificação (PDF pronto, erro, info)
  - Marcar como lida individual ou todas de uma vez

### 3. Estrutura do Banco de Dados

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  closing_id UUID REFERENCES closings(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf_ready', 'error', 'info')),
  read BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Funções do Supabase

#### `notify_pdf_ready(closing_id, pdf_url)`
- Notifica todos os usuários quando um PDF está pronto
- Chamada pelo N8N após processar o relatório

#### `notify_processing_error(closing_id, error_message)`
- Notifica em caso de erro no processamento
- Chamada pelo N8N em caso de falha

## Como Funciona o Fluxo

1. **Fechamento**: Gerente faz o fechamento do dia
2. **Registro**: Sistema registra o fechamento no banco e obtém o ID
3. **Webhook**: Envia dados para N8N incluindo o `closing_id`
4. **Processamento**: N8N processa os dados e gera o PDF
5. **Notificação**: N8N chama a função `notify_pdf_ready` no Supabase
6. **Sistema**: Usuários recebem notificação em tempo real no sininho

## Dados Enviados para o Webhook

```json
{
  "timestamp": "2025-01-30T10:30:00.000Z",
  "triggered_from": "http://localhost:8080",
  "acao": "dados relatorio",
  "Data_relatorio": "30/01/2025",
  "Valor_total_de_comps": "R$ 1.234,56",
  "Gerente_diurno": "João Silva",
  "Gerente_noturno": "Maria Santos",
  "closing_id": "123e4567-e89b-12d3-a456-426614174000",
  // ... outros campos do relatório
}
```

## Configuração do N8N

O N8N deve ser configurado para:

1. Receber os dados do webhook com `closing_id`
2. Processar e gerar o PDF
3. Chamar a função do Supabase para notificar:

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
    p_closing_id: closing_id,
    p_pdf_url: 'https://exemplo.com/relatorio.pdf'
  })
});
```

## Interface do Usuário

- **Sininho**: Aparece no header ao lado do menu
- **Contador**: Mostra número de notificações não lidas
- **Popover**: Lista todas as notificações com:
  - Título e mensagem
  - Data/hora
  - Tipo (ícone colorido)
  - Botão para baixar PDF (quando aplicável)
  - Opção para marcar como lida

## Segurança

- **RLS**: Row Level Security ativado
- **Políticas**: Usuários só veem suas próprias notificações
- **Autenticação**: Todas as operações requerem usuário autenticado

## Próximos Passos

1. Configurar o N8N para chamar as funções do Supabase
2. Testar o fluxo completo de notificações
3. Ajustar as mensagens de notificação conforme necessário
4. Implementar notificações push (opcional)
