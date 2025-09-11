# 📄 Correção de Layout do PDF no N8N

## Problema Identificado

O PDF está sendo gerado e notificado corretamente, mas há problemas de formatação:
- ✅ **Sistema de notificações**: Funcionando perfeitamente
- ✅ **PDF sendo gerado**: Armazenado no Supabase Storage
- ❌ **Layout do PDF**: Conteúdo dividido em 2 páginas, parte superior cortada

## Soluções para Melhorar o Layout

### 1. **Configurações de Página no N8N**

No nó de geração de PDF do N8N, ajuste as seguintes configurações:

```json
{
  "format": "A4",
  "orientation": "portrait",
  "margin": {
    "top": "20mm",
    "right": "15mm", 
    "bottom": "20mm",
    "left": "15mm"
  },
  "displayHeaderFooter": true,
  "headerTemplate": "<div style='font-size: 10px; text-align: center; width: 100%;'>Relatório de COMPS - {{data}}</div>",
  "footerTemplate": "<div style='font-size: 10px; text-align: center; width: 100%;'>Página <span class='pageNumber'></span> de <span class='totalPages'></span></div>"
}
```

### 2. **CSS para Melhor Formatação**

Adicione CSS personalizado no N8N para controlar o layout:

```css
/* Reset e configurações básicas */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  background: white;
}

/* Container principal */
.report-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 10px;
}

/* Cabeçalho */
.report-header {
  background: #f0f8ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.report-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  color: #2c3e50;
}

.report-info {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.info-label {
  font-weight: bold;
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
}

.info-value {
  font-size: 12px;
  color: #333;
}

/* Tabelas */
.table-container {
  margin: 20px 0;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 11px;
}

th, td {
  padding: 8px 6px;
  text-align: left;
  border: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
  font-size: 10px;
  color: #495057;
}

tr:nth-child(even) {
  background-color: #f8f9fa;
}

/* Quebras de página */
.page-break {
  page-break-before: always;
}

.no-break {
  page-break-inside: avoid;
}

/* Responsividade para PDF */
@media print {
  .report-container {
    padding: 0;
  }
  
  table {
    font-size: 10px;
  }
  
  th, td {
    padding: 6px 4px;
  }
}
```

### 3. **Estrutura HTML Otimizada**

Use esta estrutura HTML no N8N para melhor organização:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de COMPS</title>
  <style>
    /* CSS aqui */
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Cabeçalho -->
    <div class="report-header">
      <div class="report-title">RELATÓRIO DE COMPS</div>
      <div class="report-info">
        <div class="info-item">
          <div class="info-label">DATA</div>
          <div class="info-value">{{data_relatorio}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">GERENTE DIURNO</div>
          <div class="info-value">{{gerente_diurno}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">GERENTE NOTURNO</div>
          <div class="info-value">{{gerente_noturno}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">VALOR TOTAL</div>
          <div class="info-value">{{valor_total}}</div>
        </div>
      </div>
    </div>

    <!-- Tabela de Percentuais -->
    <div class="table-container no-break">
      <h3 style="margin-bottom: 10px; font-size: 14px;">PORCENTAGEM DE CADA COMPS EM RELAÇÃO AO TOTAL</h3>
      <table>
        <thead>
          <tr>
            <th>WAITER</th>
            <th>TOTAL</th>
            <th>COMPS 2</th>
            <th>COMPS 4</th>
            <th>COMPS 8</th>
            <th>COMPS 10</th>
            <th>COMPS 12</th>
            <th>COMPS 13</th>
          </tr>
        </thead>
        <tbody>
          <!-- Dados dos waiters aqui -->
        </tbody>
      </table>
    </div>

    <!-- Seção de Justificativas -->
    <div class="page-break">
      <h3 style="margin-bottom: 10px; font-size: 14px;">JUSTIFICATIVAS</h3>
      <div style="min-height: 200px; border: 1px solid #ddd; padding: 10px;">
        <!-- Espaço para justificativas -->
      </div>
    </div>
  </div>
</body>
</html>
```

### 4. **Configurações Avançadas do N8N**

No nó de geração de PDF, configure:

```json
{
  "format": "A4",
  "orientation": "portrait",
  "margin": {
    "top": "15mm",
    "right": "10mm",
    "bottom": "15mm", 
    "left": "10mm"
  },
  "displayHeaderFooter": true,
  "headerTemplate": "<div style='font-size: 9px; text-align: center; width: 100%; color: #666;'>Relatório de COMPS - {{data}}</div>",
  "footerTemplate": "<div style='font-size: 9px; text-align: center; width: 100%; color: #666;'>Página <span class='pageNumber'></span> de <span class='totalPages'></span></div>",
  "printBackground": true,
  "preferCSSPageSize": true,
  "width": "210mm",
  "height": "297mm"
}
```

### 5. **Teste de Formatação**

Para testar a formatação:

1. **Use o teste HTML**: Abra `test-n8n-webhook.html` para simular
2. **Verifique o PDF**: Acesse a URL do PDF no navegador
3. **Ajuste conforme necessário**: Modifique CSS e configurações

### 6. **Dicas Adicionais**

- **Use `page-break-before: always`** para forçar quebras de página
- **Use `page-break-inside: avoid`** para evitar quebras dentro de elementos
- **Teste com diferentes tamanhos de dados** para garantir responsividade
- **Use `overflow-x: auto`** para tabelas largas
- **Configure margens menores** se o conteúdo for muito grande

## Status Atual

✅ **Sistema de notificações**: Funcionando perfeitamente
✅ **PDF sendo gerado**: Armazenado corretamente
🔄 **Layout do PDF**: Precisa de ajustes no N8N

## Próximos Passos

1. **Aplicar configurações** no N8N conforme sugerido
2. **Testar formatação** com dados reais
3. **Ajustar CSS** conforme necessário
4. **Verificar resultado** no sininho da aplicação

O sistema de notificações está funcionando perfeitamente! O problema é apenas de formatação do PDF no N8N. 🎉
