# Configuração do N8N para Notificações de PDF

## Visão Geral

Este documento explica como configurar o N8N para enviar notificações quando o PDF do relatório estiver pronto, incluindo a opção de visualização no sininho do aplicativo.

## Fluxo Completo

1. **Fechamento**: Gerente faz o fechamento do dia
2. **Webhook**: Sistema envia dados para N8N incluindo `closing_id`
3. **Processamento**: N8N processa os dados e gera o PDF
4. **Notificação**: N8N chama função do Supabase para notificar gerentes
5. **Visualização**: Gerentes recebem notificação no sininho com opção de ver PDF

## Configuração do N8N

### 1. **Nó HTTP Request - Notificar PDF Pronto**

Após processar o PDF, adicione um nó HTTP Request para notificar o Supabase:

**URL:**
```
https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_pdf_ready
```

**Método:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_SUPABASE_ANON_KEY",
  "apikey": "SEU_SUPABASE_ANON_KEY"
}
```

**Body:**
```json
{
  "p_closing_id": "{{ $json.closing_id }}",
  "p_pdf_url": "{{ $json.pdf_url }}"
}
```

### 2. **Nó HTTP Request - Notificar Erro**

Em caso de erro no processamento, adicione um nó para notificar erro:

**URL:**
```
https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_processing_error
```

**Método:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_SUPABASE_ANON_KEY",
  "apikey": "SEU_SUPABASE_ANON_KEY"
}
```

**Body:**
```json
{
  "p_closing_id": "{{ $json.closing_id }}",
  "p_error_message": "{{ $json.error_message }}"
}
```

## Estrutura dos Dados

### **Dados Recebidos do Webhook:**
```json
{
  "closing_id": "uuid-do-fechamento",
  "timestamp": "2025-01-30T04:32:24.000Z",
  "triggered_from": "http://localhost:8080",
  "relatorio": {
    "dia_operacional": "2025-01-30",
    "total_valor": 1500.50,
    "total_comps": 25,
    "percentuais_por_tipo": {
      "Alimentação": "40%",
      "Transporte": "30%",
      "Outros": "30%"
    }
  },
  "funcionarios": [
    {
      "funcionario_id": "uuid",
      "nome": "João Silva",
      "total_valor": 150.00,
      "total_comps": 3,
      "comps_por_tipo": {
        "Alimentação": 2,
        "Transporte": 1
      }
    }
  ]
}
```

### **Dados para Notificação:**
```json
{
  "p_closing_id": "uuid-do-fechamento",
  "p_pdf_url": "https://exemplo.com/relatorios/relatorio-2025-01-30.pdf"
}
```

## Funcionalidades do Sininho

### **1. Notificações em Tempo Real**
- Atualização automática via Supabase Realtime
- Contador de notificações não lidas
- Diferentes tipos: PDF pronto, erro, info

### **2. Visualização de PDF**
- **Botão "Ver"**: Abre modal com visualização inline
- **Botão "Baixar"**: Abre PDF em nova aba para download
- **Modal responsivo**: 80% da altura da tela, 4xl de largura

### **3. Ações Disponíveis**
- Marcar como lida individual
- Marcar todas como lidas
- Visualizar PDF no modal
- Baixar PDF diretamente
- Abrir em nova aba

## Exemplo de Workflow N8N

```mermaid
graph TD
    A[Webhook Recebido] --> B[Processar Dados]
    B --> C[Gerar PDF]
    C --> D{PDF Gerado?}
    D -->|Sim| E[Notificar PDF Pronto]
    D -->|Não| F[Notificar Erro]
    E --> G[Fim]
    F --> G
```

## Testes

### **1. Teste de Notificação de PDF**
1. Acesse Configurações → Testes
2. Clique em "Teste Completo" ou "Dados do Relatório"
3. Verifique se a notificação aparece no sininho
4. Teste visualização e download do PDF

### **2. Teste de Notificação de Erro**
1. Simule erro no N8N
2. Verifique se notificação de erro aparece
3. Confirme que não há opção de visualizar PDF

## Troubleshooting

### **Erro: "invalid input syntax for type uuid"**
- ✅ **Corrigido**: Sistema agora gera UUIDs válidos para testes
- Use `crypto.randomUUID()` em vez de strings de teste

### **Notificação não aparece**
- Verifique se o Supabase Realtime está ativo
- Confirme se as funções foram aplicadas corretamente
- Teste a conexão com o Supabase

### **PDF não carrega no modal**
- Verifique se a URL do PDF é acessível
- Confirme se o PDF não tem restrições de CORS
- Teste abrindo em nova aba primeiro

## Benefícios

- ✅ **Notificações em tempo real** para todos os gerentes
- ✅ **Visualização inline** do PDF sem sair do aplicativo
- ✅ **Download direto** do PDF
- ✅ **Interface intuitiva** com sininho no header
- ✅ **Compatibilidade total** com testes e produção
- ✅ **Tratamento de erros** com notificações específicas
