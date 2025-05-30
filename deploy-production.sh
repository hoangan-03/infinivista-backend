#!/bin/bash

# Production Deployment Script for Infinivista Backend
# This script helps deploy the microservices in production

set -e

echo "🚀 Infinivista Backend Production Deployment"
echo "============================================="

# Check if root .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: Root .env file not found!"
    echo "   Please create .env file in the root directory with production values."
    exit 1
fi

# Check if module-specific .env.prod files exist
echo "🔍 Checking module environment files..."

modules=("api-gateway" "module-user" "module-feed" "module-communication")
missing_files=()

for module in "${modules[@]}"; do
    if [ ! -f "$module/.env.prod" ]; then
        missing_files+=("$module/.env.prod")
        echo "⚠️  Warning: $module/.env.prod not found, will use $module/.env if available"
    else
        echo "✅ Found: $module/.env.prod"
    fi
    
    if [ ! -f "$module/.env" ]; then
        echo "❌ Error: $module/.env not found!"
        exit 1
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "📋 Missing .env.prod files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "💡 Tip: Create .env.prod files for production-specific configurations"
    echo "   or ensure .env files contain production values"
    echo ""
fi

# Create data directories if they don't exist
echo "📁 Creating data directories..."
mkdir -p ./data/postgres
mkdir -p ./data/rabbitmq

# Set proper permissions for data directories
echo "🔒 Setting permissions for data directories..."
chmod 755 ./data/postgres
chmod 755 ./data/rabbitmq

# Build production images
echo "🔨 Building production Docker images..."
docker-compose build --no-cache

# Pull latest base images
echo "📥 Pulling latest base images..."
docker-compose pull

# Start the services
echo "🎬 Starting production services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Run database migrations (if needed)
echo "🌱 Running database migrations and seeding..."
npm run seed || true

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=50

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 API Gateway is available at: http://localhost:${GATEWAY_PORT:-3000}"
echo ""
echo "📝 Useful commands:"
echo "   View logs:           docker-compose logs -f"
echo "   Stop services:       docker-compose down"
echo "   Restart services:    docker-compose restart"
echo "   Update services:     docker-compose pull && docker-compose up -d"
echo ""
echo "🔧 Health checks:"
echo "   Gateway health:      curl http://localhost:${GATEWAY_PORT:-3000}/health"
echo "   Database status:     docker-compose exec db pg_isready"
echo "   RabbitMQ status:     docker-compose exec rabbitmq rabbitmq-diagnostics check_port_connectivity"
