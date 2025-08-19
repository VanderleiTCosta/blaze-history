# backend/Dockerfile

# Usamos uma imagem oficial do Node.js como base
FROM node:20-slim

# Definimos o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Instala todas as dependências necessárias para o Google Chrome rodar
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    # Dependências do Chrome
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends

# Baixa e instala a versão estável do Google Chrome
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb \
    && rm -rf /var/lib/apt/lists/*


# Copia os arquivos package.json e package-lock.json para o container
COPY package*.json ./

# Instala as dependências do seu projeto (express, ws, puppeteer, etc.)
RUN npm install

# Copia o resto do código do seu backend para o container
COPY . .

# Comando que o Render irá executar para iniciar seu servidor
CMD [ "npm", "start" ]