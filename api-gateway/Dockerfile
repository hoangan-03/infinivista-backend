FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci
RUN npm install -g @nestjs/cli

COPY . .
RUN mkdir -p src/migrations

RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/migrations ./src/migrations

CMD ["npm", "run", "start:dev"]