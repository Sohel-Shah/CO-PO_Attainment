FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .

EXPOSE 3001 3002 3003 3004 3005 3006 3007

ENV NODE_ENV=production

CMD ["npm", "start"]
