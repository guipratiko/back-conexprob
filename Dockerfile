FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Expor porta (será substituída pela variável de ambiente)
EXPOSE ${PORT}

# Comando para iniciar
CMD ["npm", "start"]

