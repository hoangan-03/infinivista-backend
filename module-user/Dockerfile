# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies including dev dependencies
RUN npm ci
# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

COPY . .
# Create migrations directory if it doesn't exist
RUN mkdir -p src/migrations

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/migrations ./src/migrations

EXPOSE 3000

CMD ["npm", "run", "start:prod"]