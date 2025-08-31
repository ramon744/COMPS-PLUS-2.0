# Dockerfile para Comps Plus 54
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY bun.lockb ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine AS production

# Copiar build da aplicação
COPY --from=base /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
