# Teste de Notificações de PDF

## Como Testar

### 1. **Teste Manual via Supabase**

Acesse o Supabase Dashboard e execute:

```sql
-- Inserir notificação de teste
INSERT INTO notifications (
  user_id,
  closing_id,
  title,
  message,
  type,
  pdf_url
) VALUES (
  'SEU_USER_ID_AQUI',
  NULL,
  'PDF do Relatório Disponível (TESTE)',
  'Teste: O relatório está pronto para visualização.',
  'pdf_ready',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
);
```

### 2. **Teste via Função RPC**

```sql
-- Chamar função de notificação
SELECT notify_pdf_ready(
  'test-uuid-123',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
);
```

### 3. **Teste via Aplicação**

1. Acesse http://localhost:8080
2. Vá para Configurações → Testes
3. Clique em "Teste Completo" ou "Dados do Relatório"
4. Verifique se a notificação aparece no sininho
5. Teste os botões "Ver" e "Baixar"

## Funcionalidades Testadas

### ✅ **Modal de Visualização**
- Abre modal com iframe do PDF
- Botões de download e nova aba
- Responsivo (80% altura, 4xl largura)

### ✅ **Botões de Ação**
- **Ver**: Abre modal de visualização
- **Baixar**: Abre PDF em nova aba
- **Marcar como lida**: Remove notificação não lida

### ✅ **Notificações em Tempo Real**
- Atualização automática via Supabase Realtime
- Contador de notificações não lidas
- Diferentes tipos de notificação

## URLs de Teste

### **PDFs de Teste Disponíveis:**
- https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
- https://www.africau.edu/images/default/sample.pdf
- https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf

### **PDFs que Podem Não Funcionar:**
- PDFs com restrições de CORS
- PDFs que requerem autenticação
- PDFs muito grandes (>10MB)

## Configuração do N8N

### **URL do Webhook:**
```
https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_pdf_ready
```

### **Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_SUPABASE_ANON_KEY",
  "apikey": "SEU_SUPABASE_ANON_KEY"
}
```

### **Body:**
```json
{
  "p_closing_id": "{{ $json.closing_id }}",
  "p_pdf_url": "{{ $json.pdf_url }}"
}
```

## Troubleshooting

### **PDF não carrega no modal:**
1. Teste abrindo a URL em nova aba
2. Verifique se o PDF não tem restrições de CORS
3. Use um PDF de teste público

### **Notificação não aparece:**
1. Verifique se o Supabase Realtime está ativo
2. Confirme se o usuário está logado
3. Teste inserindo notificação manualmente

### **Erro de UUID:**
1. Use `crypto.randomUUID()` para gerar IDs de teste
2. Verifique se as funções do Supabase foram aplicadas
3. Teste com UUID válido

## Próximos Passos

1. **Configurar N8N** com as URLs e headers corretos
2. **Testar em produção** com fechamento real
3. **Configurar URLs de PDF** reais do seu sistema
4. **Ajustar permissões** se necessário
