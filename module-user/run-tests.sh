#!/bin/bash

# Load test environment
export $(grep -v '^#' .env.test | xargs)

# Check if RabbitMQ is available
echo "Checking RabbitMQ connection..."
nc -z $RABBITMQ_HOST_NAME $RABBITMQ_PORT || { echo "RabbitMQ not available!"; exit 1; }

# Run the tests
echo "Running tests..."
npm run test -- $1

# Exit with the test exit code
exit $?
