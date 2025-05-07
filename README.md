# Infinivista Backend

A microservices-based backend system built with Node.js, TypeScript, and PostgreSQL, featuring a modular architecture with event-driven communication.

## 🏗 Architecture

The system is built using a microservices architecture with the following components:

- **API Gateway**: Entry point for all client requests
- **User Module**: Handles user management and authentication
- **Feed Module**: Manages content feed and related operations
- **Communication Module**: Handles real-time communication and notifications

### Infrastructure

- **Database**: PostgreSQL 15
- **Message Broker**: RabbitMQ 3.11
- **Database Management**: pgAdmin 4
- **Containerization**: Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version)
- Docker and Docker Compose
- Git

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/infinivista-backend.git
cd infinivista-backend
```

2. Create environment files:
```bash
# Create .env files in each module directory
cp api-gateway/.env.example api-gateway/.env
cp module-user/.env.example module-user/.env
cp module-feed/.env.example module-feed/.env
cp module-communication/.env.example module-communication/.env
```

3. Install dependencies:
```bash
npm install
cd api-gateway && npm install
cd ../module-user && npm install
cd ../module-feed && npm install
cd ../module-communication && npm install
```

### Running the Application

1. Start the development environment:
```bash
npm run start
```

This will:
- Build and start all Docker containers
- Set up the database
- Start all microservices

2. Access the services:
- API Gateway: http://localhost:3001
- pgAdmin: http://localhost:8888
- RabbitMQ Management: http://localhost:15672

### Database Management

- Database runs on port 5435
- pgAdmin is available at http://localhost:8888
- Default credentials are in the .env file

## 📝 Available Scripts

- `npm run start`: Start the development environment
- `npm run down`: Stop all containers
- `npm run migrate`: Run database migrations
- `npm run seed`: Seed the database with initial data
- `npm run lint`: Run linting across all modules
- `npm run format`: Format code across all modules
- `npm run clean`: Clean generated files

## 🏗 Project Structure

```
infinivista-backend/
├── api-gateway/           # API Gateway service
├── module-user/          # User management service
├── module-feed/          # Feed management service
├── module-communication/ # Communication service
├── scripts/             # Utility scripts
└── docker-compose.yaml  # Docker configuration
```

## 🔧 Development

### Adding New Features

1. Create feature branch from main
2. Implement changes
3. Run tests and linting
4. Submit pull request

### Code Style

- TypeScript is used throughout the project
- ESLint and Prettier are configured for code formatting
- Run `npm run format` before committing

## 📚 API Documentation

API documentation is available through Swagger UI when running the application:
- API Gateway: http://localhost:3001/api-docs

## 🔐 Environment Variables

Key environment variables needed:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# API Gateway
PORT=3001
NODE_ENV=development

# Add other required environment variables
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please open an issue in the GitHub repository.
