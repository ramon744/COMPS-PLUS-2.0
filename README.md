# COMPS-PLUS-2.0 - Sistema Completo de Gerenciamento de Comps

Sistema completo para gerenciamento de comps (itens cortesia) do restaurante com integração direta ao Google Sheets, sistema de perdas de serviço e notificações automáticas.

## 🚀 Funcionalidades Principais

- ✅ **Sistema de Comps** - Registro e gerenciamento de comps por garçom
- ✅ **Perdas de Serviço** - Registro de perdas de serviço com relatórios
- ✅ **Integração Google Sheets** - Atualização automática de planilhas
- ✅ **Notificações** - Sistema de notificações com PDF estático
- ✅ **Emails Automáticos** - Envio de relatórios por email
- ✅ **Limpeza Automática** - Limpeza automática da planilha após fechamento
- ✅ **Relatórios** - Relatórios detalhados com gráficos
- ✅ **Autenticação** - Sistema de login seguro

## 📋 Funcionalidades do Sistema

### Sistema de Comps
- Registro de comps por garçom
- Cálculo automático de porcentagens
- Justificativas para cada comp
- Relatórios por período e garçom

### Sistema de Perdas de Serviço
- Registro de perdas de serviço
- Categorização por motivo
- Relatórios estatísticos
- Integração com relatórios de fechamento

### Notificações e Emails
- Notificações em tempo real
- PDF estático para download
- Emails automáticos com anexos XLSX
- Sistema de "sisninho" (sino de notificações)

### Limpeza Automática
- Trigger automático de limpeza
- Limpeza de dados antigos
- Auto-exclusão do trigger após execução

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase + Google Apps Script
- **UI**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **PDF**: html2canvas + jsPDF
- **Excel**: XLSX.js

## 📦 Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/ramon744/COMPS-PLUS-2.0.git
   cd COMPS-PLUS-2.0
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
```bash
   cp .env.example .env
```

   Edite o arquivo `.env` com suas configurações:
```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   VITE_GOOGLE_APPS_SCRIPT_URL=sua_url_do_google_apps_script
   ```

4. **Execute as migrações do Supabase**:
   ```bash
   npx supabase db push
   ```

5. **Inicie o servidor de desenvolvimento**:
```bash
   npm run dev
   ```

## 🔧 Configuração do Google Apps Script

1. **Crie um novo projeto** no Google Apps Script
2. **Cole o código** do arquivo `SCRIPT-GOOGLE-APPS-RESTAURADO.js`
3. **Configure as variáveis** no início do script:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. **Publique como aplicação web** com permissões adequadas
5. **Copie a URL** e configure no arquivo `.env`

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── contexts/            # Contextos (Auth, Comps, etc.)
├── hooks/              # Hooks customizados
├── pages/              # Páginas da aplicação
├── services/           # Serviços de integração
├── utils/              # Utilitários
└── types/              # Definições de tipos
```

## 🚀 Deploy na Vercel

1. **Conecte o repositório** à Vercel
2. **Configure as variáveis de ambiente** na Vercel
3. **Deploy automático** será feito a cada push

## 📱 Funcionalidades por Página

### Dashboard
- Visão geral do sistema
- Botões de acesso rápido
- Estatísticas em tempo real

### Comps
- Registro de comps
- Listagem de comps por garçom
- Fechamento de comps

### Perdas de Serviço
- Registro de perdas
- Listagem e filtros
- Relatórios estatísticos

### Relatórios
- Relatórios de comps
- Relatórios de perdas
- Gráficos e estatísticas
- Exportação para Excel/PDF

### Configurações
- Configurações do sistema
- Gerenciamento de usuários
- Configurações de email

## 🔐 Autenticação

O sistema utiliza autenticação via Supabase com:
- Login por email/senha
- Recuperação de senha
- Gerenciamento de sessão
- Controle de permissões

## 📧 Sistema de Emails

- **Resend API** para envio de emails
- **Anexos XLSX** automáticos
- **PDF estático** para notificações
- **Templates HTML** personalizados

## 🧹 Limpeza Automática

- **Trigger de 10 minutos** após fechamento
- **Limpeza de cabeçalho** e dados de garçons
- **Auto-exclusão** do trigger após execução
- **Logs detalhados** para monitoramento

## 🐛 Solução de Problemas

### Problemas Comuns

1. **Erro de autenticação**: Verifique as chaves do Supabase
2. **Erro no Google Apps Script**: Verifique a URL e permissões
3. **Emails não enviados**: Verifique a configuração do Resend
4. **Planilha não atualiza**: Verifique as permissões do GAS

### Logs e Debug

- **Console do navegador** para erros frontend
- **Logs do Google Apps Script** para erros backend
- **Logs do Supabase** para erros de banco

## 📞 Suporte

Para suporte técnico:
1. Verifique os logs de erro
2. Confirme as configurações
3. Teste com dados simples
4. Verifique as permissões

## 🔄 Atualizações

O sistema está em constante evolução com:
- Melhorias de performance
- Novas funcionalidades
- Correções de bugs
- Otimizações de segurança

## 📄 Licença

Este projeto é proprietário e confidencial.