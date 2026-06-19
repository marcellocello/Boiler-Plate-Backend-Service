FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm install --omit=dev

FROM base AS runner
ENV node_env=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]