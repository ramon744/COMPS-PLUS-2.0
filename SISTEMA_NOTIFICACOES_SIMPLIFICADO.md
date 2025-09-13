# Sistema de Notificações Simplificado

## Visão Geral

Sistema simplificado de notificações onde o N8N gera o PDF e envia apenas o link para o Supabase notificar os usuários.

## Fluxo Simplificado

1. **Fechamento**: Gerente faz o fechamento do dia
2. **Webhook**: Sistema envia dados para N8N
3. **Processamento**: N8N processa os dados e gera o PDF
4. **Notificação**: N8N chama função do Supabase com apenas o link do PDF
5. **Visualização**: Usuários recebem notificação no sininho com link direto

## Configuração do N8N

### 1. **Nó HTTP Request - Notificar PDF Pronto**

Após gerar o PDF, adicione um nó HTTP Request para notificar o Supabase:

**URL:**
```
https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_pdf_ready_simple
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
  "p_pdf_url": "https://exemplo.com/relatorio.pdf"
}
```

### 2. **Exemplo de Resposta da Função**

```json
{
  "success": true,
  "message": "Notificações criadas com sucesso",
  "notifications_created": 7,
  "pdf_url": "https://exemplo.com/relatorio.pdf",
  "timestamp": "2025-09-13T17:55:26.153892+00:00"
}
```

## Vantagens da Nova Abordagem

1. **Simplicidade**: N8N só precisa enviar o link do PDF
2. **Performance**: Sem processamento de PDF no Supabase
3. **Flexibilidade**: N8N pode gerar PDFs em qualquer formato
4. **Manutenção**: Menos código para manter
5. **Escalabilidade**: Supabase foca apenas nas notificações

## Função do Supabase

### `notify_pdf_ready_simple(p_pdf_url TEXT)`

**Parâmetros:**
- `p_pdf_url`: URL do PDF gerado pelo N8N

**Funcionalidade:**
- Notifica todos os usuários autenticados
- Cria notificação com link direto para o PDF
- Retorna JSON com resultado da operação

**Exemplo de Uso:**
```sql
SELECT notify_pdf_ready_simple('https://meusite.com/relatorio-2025-01-30.pdf');
```

## Interface do Usuário

- **Sininho**: Aparece no header com contador de notificações
- **Popover**: Lista notificações com:
  - Título: "PDF do Relatório Disponível"
  - Mensagem: "O relatório está pronto para visualização."
  - Botão para abrir PDF diretamente
  - Data/hora da notificação

## Configuração do Webhook

O webhook continua enviando os mesmos dados de produção:

### Dados dos Funcionários
```json
{
  "acao": "dados funcionarios",
  "Nome": "João Silva",
  "Total_de_comps": "R$ 150,50",
  "Total_de_comps2": "R$ 75,25",
  "Total_de_comps4": "R$ 50,00",
  "Total_de_comps8": "R$ 25,25",
  "Justificativas": "Atendimento excepcional"
}
```

### Dados do Relatório
```json
{
  "acao": "dados relatorio",
  "Data_relatorio": "30/01/2025",
  "Valor_total_de_comps": "R$ 1.234,56",
  "Gerente_diurno": "João Silva",
  "Gerente_noturno": "Maria Santos",
  "closing_id": "uuid-do-fechamento"
}
```

## Teste da Função

Use a aba "Teste Webhook" nas configurações para testar:

1. **Teste Funcionários**: Envia dados individuais
2. **Teste Relatório**: Envia dados gerais
3. **Teste Completo**: Executa fluxo completo

## Próximos Passos

1. **Configurar N8N** para chamar `notify_pdf_ready_simple`
2. **Testar fluxo completo** com dados reais
3. **Ajustar mensagens** de notificação se necessário
4. **Monitorar performance** do sistema

## Segurança

- **RLS**: Row Level Security ativado
- **Políticas**: Usuários só veem suas próprias notificações
- **Autenticação**: Todas as operações requerem usuário autenticado
- **Validação**: URL do PDF é validada antes de criar notificações
