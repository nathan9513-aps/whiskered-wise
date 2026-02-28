# Usa una base Node.js minimale ma recente (18+)
FROM node:18-bullseye-slim

# Installa le dipendenze di sistema necessarie per Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
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
    wget \
    xdg-utils \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Imposta la cartella di lavoro
WORKDIR /app

# Copia package.json
COPY package*.json ./

# Installa le dipendenze Node.js (solo quelle necessarie in produzione)
RUN npm ci --omit=dev

# Copia solo i file del server
COPY server.js ./

# Variabili d'ambiente per far trovare Chromium a Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Esponi la porta (Fly.io userà questa porta, oppure puoi specificarla in fly.toml)
EXPOSE 3001

# Avvia il server
CMD ["node", "server.js"]
