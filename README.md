# Comps Manager - Sistema de Gerenciamento de Comps

Sistema para substituir o n8n e fazer integração direta com planilha Google Sheets para gerenciamento de comps (itens cortesia) do restaurante.

## 🚀 Funcionalidades

- ✅ **Integração direta** com Google Sheets (sem n8n)
- ✅ **Atualização automática** de cabeçalho (data, gerentes, porcentagens)
- ✅ **Cálculo automático** de porcentagens por tipo de comp
- ✅ **Adição de waiters** com todos os dados necessários
- ✅ **Limpeza automática** de dados antigos
- ✅ **Formatação brasileira** de datas (DD/MM/AAAA)
- ✅ **Tratamento de erros** robusto

## 📋 Estrutura da Planilha

### Cabeçalho (Linhas 1-6)
- **B1**: Data operacional (DD/MM/AAAA)
- **E1**: Gerente diurno
- **D2**: Gerente noturno
- **C6**: Porcentagem de Comps 2
- **D6**: Porcentagem de Comps 4
- **E6**: Porcentagem de Comps 8
- **F6**: Porcentagem de Comps 11
- **G6**: Porcentagem de Comps 12
- **H6**: Porcentagem de Comps 13

### Dados dos Waiters (A partir da linha 8)
- **A8+**: Nome do waiter
- **B8+**: Total de comps
- **C8+**: Comps 2
- **D8+**: Comps 4
- **E8+**: Comps 8
- **F8+**: Comps 11
- **G8+**: Comps 12
- **H8+**: Comps 13
- **I8+**: Justificativas (separadas por /)

## 🛠️ Instalação

1. **Instalar dependências** (se necessário):
   ```bash
   npm install
   ```

2. **Configurar URL da planilha** no arquivo `TXT`:
```typescript
export const sheets = new SheetsApi({
  baseUrl: 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI',
  timeoutMs: 15000,
});
```

## 📖 Como Usar

### Uso Básico

```typescript
import { compsManager, FechamentoData } from './comps-manager';

// Criar dados do fechamento
const fechamento: FechamentoData = {
  dataOperacional: '15/12/2024',
  gerenteDiurno: 'João Silva',
  gerenteNoturno: 'Maria Santos',
  waiters: [
    {
      nome: 'Carlos',
      total: 25,
      comps2: 5,
      comps4: 3,
      comps8: 2,
      justificativas: 'Cliente VIP/Problema no pedido'
    },
    {
      nome: 'Ana',
      total: 18,
      comps2: 2,
      comps11: 1,
      comps12: 1,
      justificativas: 'Aniversário/Reclamação atendida'
    }
  ]
};

// Processar fechamento
await compsManager.processarFechamento(fechamento);
```

### Uso com Data Atual

```typescript
import { compsManager } from './comps-manager';

const hoje = new Date();
const dataFormatada = hoje.getDate().toString().padStart(2, '0') + '/' + 
                     (hoje.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                     hoje.getFullYear();

const fechamento = {
  dataOperacional: dataFormatada,
  gerenteDiurno: 'Roberto Lima',
  gerenteNoturno: 'Fernanda Costa',
  waiters: [
    // ... seus waiters
  ]
};

await compsManager.processarFechamento(fechamento);
```

### Consultar Dados Existentes

```typescript
// Ler todos os dados
const dados = await compsManager.lerDadosAtuais();

// Ler apenas waiters
const waiters = await compsManager.lerWaiters();
```

## 🔧 API Detalhada

### CompsManager

#### `processarFechamento(fechamento: FechamentoData): Promise<void>`
Processa fechamento completo:
1. Atualiza cabeçalho (data, gerentes, porcentagens)
2. Limpa dados antigos dos waiters
3. Adiciona novos dados dos waiters

#### `atualizarCabecalho(fechamento: FechamentoData): Promise<void>`
Atualiza apenas o cabeçalho da planilha.

#### `adicionarWaiters(waiters: WaiterData[]): Promise<void>`
Adiciona dados dos waiters a partir da linha 8.

#### `limparDadosWaiters(): Promise<void>`
Limpa dados antigos dos waiters.

#### `lerDadosAtuais(): Promise<any>`
Lê todos os dados da planilha.

#### `lerWaiters(): Promise<WaiterData[]>`
Lê apenas os dados dos waiters.

### Interfaces

#### `FechamentoData`
```typescript
interface FechamentoData {
  dataOperacional: string; // DD/MM/AAAA
  gerenteDiurno: string;
  gerenteNoturno: string;
  waiters: WaiterData[];
}
```

#### `WaiterData`
```typescript
interface WaiterData {
  nome: string;
  total: number;
  comps2?: number;
  comps4?: number;
  comps8?: number;
  comps11?: number;
  comps12?: number;
  comps13?: number;
  justificativas: string;
}
```

## 📊 Exemplos Práticos

Execute os exemplos incluídos:

```typescript
import { executarExemplos } from './exemplo-uso';

// Executar todos os exemplos
await executarExemplos();
```

Ou execute exemplos individuais:

```typescript
import { 
  exemploFechamentoSimples,
  exemploFechamentoDataAtual,
  exemploConsultarDados 
} from './exemplo-uso';

await exemploFechamentoSimples();
await exemploFechamentoDataAtual();
await exemploConsultarDados();
```

## ⚠️ Importante

1. **URL da Planilha**: Certifique-se de que a URL do Google Apps Script está correta no arquivo `TXT`.

2. **Permissões**: O Google Apps Script deve ter permissões para editar a planilha.

3. **Formato de Data**: Use sempre o formato brasileiro DD/MM/AAAA.

4. **Justificativas**: Separe múltiplas justificativas com "/".

5. **Campos Opcionais**: Os campos de comps específicos (comps2, comps4, etc.) são opcionais.

## 🐛 Tratamento de Erros

O sistema inclui tratamento robusto de erros:
- Timeout de 15 segundos para requisições
- Validação de dados antes do envio
- Logs detalhados para debugging
- Rollback automático em caso de erro

## 🔄 Migração do n8n

Para migrar do n8n:

1. **Pare o n8n** que estava fazendo a integração
2. **Configure a URL** da planilha no arquivo `TXT`
3. **Use o CompsManager** no lugar das workflows do n8n
4. **Teste** com dados de exemplo antes de usar em produção

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs no console
2. Confirme se a URL da planilha está correta
3. Teste com dados simples primeiro
4. Verifique as permissões do Google Apps Script