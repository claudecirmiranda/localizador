FROM node:20-bookworm-slim

WORKDIR /app

# python3/make/g++ como fallback: se o better-sqlite3 não achar um binário
# pré-compilado pra essa plataforma, ele compila na hora do npm install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
