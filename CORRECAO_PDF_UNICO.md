# 🔧 Correção: PDFs únicos por fechamento

## Problema Identificado

O Supabase estava sempre retornando o mesmo link do PDF (`comps.pdf`) mesmo com dados base64 diferentes, porque:

1. **Nome fixo**: A Edge Function usava sempre `comps.pdf`
2. **Upsert ativado**: `upsert: true` sobrescrevia o arquivo anterior
3. **Sem timestamp**: Não havia identificação única por fechamento

## Solução Implementada

### **1. Nomes de Arquivo Únicos**

Agora cada PDF tem um nome único baseado no `closing_id` e timestamp:

```typescript
// 🔧 CORREÇÃO: Gerar nome único baseado no closing_id e timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = payload.pdf_filename || `relatorio_${payload.closing_id}_${timestamp}.pdf`;
const filePath = `pdfs/${filename}`;
```

**Exemplo de nomes gerados:**
- `relatorio_63ba637f-9d47-4964-a7c6-c7afd82304e2_2025-09-11T16-54-49-525Z.pdf`
- `relatorio_abc123-def456-ghi789_2025-09-11T17-30-15-123Z.pdf`

### **2. Sem Sobrescrita**

Desabilitado o `upsert` para não sobrescrever arquivos:

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage.from('reports').upload(filePath, pdfBuffer, {
  contentType: 'application/pdf',
  upsert: false // 🔧 CORREÇÃO: Não sobrescrever, criar arquivo único
});
```

### **3. Fallback para Conflitos**

Se o arquivo já existir, gera um nome com timestamp único:

```typescript
if (uploadError.message.includes('already exists')) {
  const uniqueFilename = `relatorio_${payload.closing_id}_${Date.now()}.pdf`;
  const uniqueFilePath = `pdfs/${uniqueFilename}`;
  
  console.log('🔄 Arquivo já existe, tentando com nome único:', uniqueFilename);
  // ... tentar upload com nome único
}
```

## Benefícios da Correção

### **✅ PDFs Únicos**
- Cada fechamento gera um PDF único
- Não há sobrescrita de arquivos anteriores
- Histórico completo de relatórios preservado

### **✅ Rastreabilidade**
- Nome do arquivo inclui `closing_id`
- Timestamp para ordenação cronológica
- Fácil identificação do fechamento

### **✅ Notificações Corretas**
- Cada notificação aponta para o PDF correto
- Usuários veem o relatório do fechamento específico
- Não há confusão entre relatórios diferentes

## Estrutura de Arquivos

```
reports/pdfs/
├── relatorio_63ba637f-9d47-4964-a7c6-c7afd82304e2_2025-09-11T16-54-49-525Z.pdf
├── relatorio_abc123-def456-ghi789_2025-09-11T17-30-15-123Z.pdf
├── relatorio_xyz789-uvw456-rst123_2025-09-11T18-45-30-789Z.pdf
└── ...
```

## Logs de Debug

A Edge Function agora mostra logs detalhados:

```
📁 Nome do arquivo gerado: relatorio_63ba637f-9d47-4964-a7c6-c7afd82304e2_2025-09-11T16-54-49-525Z.pdf
📁 Caminho completo: pdfs/relatorio_63ba637f-9d47-4964-a7c6-c7afd82304e2_2025-09-11T16-54-49-525Z.pdf
📤 Fazendo upload do PDF para storage: pdfs/relatorio_63ba637f-9d47-4964-a7c6-c7afd82304e2_2025-09-11T16-54-49-525Z.pdf
✅ PDF único criado com sucesso: https://mywxfyfzonzsnfplyogv.supabase.co/storage/v1/object/public/reports/pdfs/relatorio_63ba637f-9d47-4964-a7c6-c7afd82304e2_2025-09-11T16-54-49-525Z.pdf
```

## Teste da Correção

### **1. Fazer um novo fechamento**
1. Acesse a aplicação
2. Faça um fechamento normal
3. Verifique se o PDF tem nome único

### **2. Verificar no Supabase Storage**
1. Acesse o Supabase Dashboard
2. Vá para Storage → reports → pdfs
3. Verifique se há arquivos com nomes únicos

### **3. Verificar notificações**
1. Verifique se as notificações aparecem no sininho
2. Teste visualização do PDF
3. Confirme que cada notificação aponta para o PDF correto

## Status da Correção

✅ **Edge Function Atualizada**: Versão 6 deployada com sucesso
✅ **Nomes Únicos**: Baseados em closing_id + timestamp
✅ **Sem Sobrescrita**: upsert: false ativado
✅ **Fallback**: Para conflitos de nomes
✅ **Logs Detalhados**: Para debug e monitoramento

## Próximos Passos

1. **Testar em Produção**: Fazer um fechamento real
2. **Verificar PDFs**: Confirmar que cada um é único
3. **Monitorar Logs**: Acompanhar funcionamento
4. **Verificar Notificações**: Confirmar que apontam para PDFs corretos

## Resumo

Agora cada fechamento gera um PDF único com nome baseado no `closing_id` e timestamp. Não há mais sobrescrita de arquivos e cada notificação aponta para o PDF correto do fechamento específico! 🎉

**A correção foi aplicada e o sistema deve gerar PDFs únicos para cada fechamento!** ✅
