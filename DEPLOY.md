# 🚀 Guia Completo de Deploy na Vercel

## 📋 Pré-requisitos

- ✅ Conta na [Vercel](https://vercel.com)
- ✅ Conta no [Supabase](https://supabase.com)
- ✅ Node.js 18+ instalado
- ✅ Git configurado

## 🔧 Configuração Local

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Fazer login na Vercel
```bash
vercel login
```

### 3. Testar build local
```bash
npm run build
```

## 🚀 Deploy Manual

### Opção 1: Deploy via CLI
```bash
# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

### Opção 2: Deploy via GitHub
1. Conecte seu repositório na Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## ⚙️ Configuração na Vercel

### Variáveis de Ambiente
Configure estas variáveis no painel da Vercel:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://dplfodkrsaffzljmteub.supabase.co` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Chave anônima do Supabase |
| `VITE_APP_ENV` | `production` | Ambiente da aplicação |
| `VITE_APP_VERSION` | `1.0.0` | Versão da aplicação |

### Configurações do Projeto
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔄 Deploy Automático (GitHub Actions)

### 1. Configurar Secrets no GitHub
Vá para `Settings > Secrets and variables > Actions` e adicione:

- `VERCEL_TOKEN`: Token da Vercel
- `ORG_ID`: ID da organização Vercel
- `PROJECT_ID`: ID do projeto Vercel
- `VITE_SUPABASE_URL`: URL do Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave do Supabase

### 2. Obter Vercel Token
```bash
vercel token list
```

### 3. Obter Project ID
```bash
vercel project ls
```

## 📁 Estrutura de Arquivos para Deploy

```
comps-plus-54/
├── vercel.json          # Configuração da Vercel
├── .vercelignore        # Arquivos ignorados no deploy
├── .github/workflows/   # GitHub Actions
├── env.production       # Variáveis de produção
├── vite.config.ts       # Configuração do Vite
├── tsconfig.app.json    # Configuração TypeScript
└── package.json         # Dependências e scripts
```

## 🧪 Testando o Deploy

### 1. Verificar Build
```bash
npm run build
npm run preview
```

### 2. Verificar TypeScript
```bash
npm run type-check
```

### 3. Verificar Lint
```bash
npm run lint
```

## 🚨 Solução de Problemas

### Erro: Build falhou
```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Erro: Variáveis de ambiente
- Verifique se todas as variáveis estão configuradas na Vercel
- Confirme se os valores estão corretos

### Erro: TypeScript
```bash
npm run type-check
# Corrija os erros antes do deploy
```

## 📊 Monitoramento

### Logs da Vercel
- Acesse o painel da Vercel
- Vá para o projeto > Functions
- Verifique os logs de build e runtime

### Performance
- Use o Lighthouse da Vercel
- Monitore Core Web Vitals
- Verifique métricas de performance

## 🔒 Segurança

### Headers de Segurança
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Cache
- Assets estáticos: 1 ano
- Páginas: Sem cache (SPA)

## 📈 Próximos Passos

1. ✅ Configurar domínio personalizado
2. ✅ Implementar CDN
3. ✅ Configurar monitoramento
4. ✅ Implementar backup automático
5. ✅ Configurar alertas de performance

---

**🎯 Seu app está pronto para ir ao ar na Vercel!**

Para dúvidas ou suporte, consulte a [documentação da Vercel](https://vercel.com/docs).
