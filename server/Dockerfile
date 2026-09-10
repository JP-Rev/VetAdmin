FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY src ./src

# Los scripts de migracion/recuperacion corren con `docker compose run`, asi que
# tienen que estar dentro de la imagen. Omitirlos hizo fallar una migracion de
# datos en produccion (ver scripts/README.md).
COPY scripts ./scripts

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && npm start"]
