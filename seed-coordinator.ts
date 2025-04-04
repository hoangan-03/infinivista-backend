import * as amqp from "amqplib";
import { Buffer } from "buffer";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Configure environment
dotenv.config();

// For debugging - Log to both console and file
function log(message: string, level: 'info'|'error'|'debug' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  // Also log to file for persistent debugging
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(
    path.join(logDir, 'seed-coordinator.log'),
    logMessage + '\n'
  );
}

// Define interfaces for type safety
interface UserReference {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  [key: string]: any;
}

async function seedCoordinator() {
  log("Starting coordinated seeding process...");

  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    log("Connecting to RabbitMQ...");
    const rabbitHost = process.env.RABBITMQ_HOST_NAME || "localhost";
    const rabbitPort = process.env.RABBITMQ_PORT || "5675";
    log(`Using RabbitMQ connection: amqp://${rabbitHost}:${rabbitPort}`);
    
    connection = await amqp.connect(`amqp://${rabbitHost}:${rabbitPort}`);
    channel = await connection.createChannel();
    log("Connected to RabbitMQ successfully", "debug");

    // Step 1: Seed User Module
    log("Step 1: Seeding user module...");
    try {
      await channel.assertQueue("USER_SEED_QUEUE", { durable: false });
      log("USER_SEED_QUEUE created successfully", "debug");
      
      const userSeedPayload = { command: "seed", count: 2 };
      log(`Sending payload to USER_SEED_QUEUE: ${JSON.stringify(userSeedPayload)}`, "debug");
      
      await channel.sendToQueue(
        "USER_SEED_QUEUE",
        Buffer.from(JSON.stringify(userSeedPayload))
      );
      log("User seed command sent successfully");
    } catch (error) {
      log(`Failed to send user seed command: ${error.message}`, "error");
      log(error.stack, "error");
      throw error;
    }

    // Wait for user module to complete seeding
    log("Waiting for user seeding to complete...");
    const userSeedingTimeout = 150000;
    log(`Setting timeout for ${userSeedingTimeout}ms`, "debug");
    await new Promise((resolve) => setTimeout(resolve, userSeedingTimeout));

    // Step 2: Export user references for other modules
    log("Step 2: Fetching created users...");
    
    // Create necessary queues
    try {
      log("Creating USER_EXPORT_RESULT queue...", "debug");
      await channel.assertQueue("USER_EXPORT_RESULT", { durable: false });
      
      log("Creating USER_EXPORT_QUEUE queue...", "debug");
      await channel.assertQueue("USER_EXPORT_QUEUE", { durable: false });
      
      log("Queues created successfully");
    } catch (error) {
      log(`Failed to create queues: ${error.message}`, "error");
      log(error.stack, "error");
      throw error; 
    }

    // Set up timeout to avoid hanging indefinitely
    const exportTimeout = 15000; // 15 seconds
    log(`Setting user export timeout for ${exportTimeout}ms`, "debug");
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Timeout waiting for user data")),
        exportTimeout
      );
    });

    // Listen for user export result
    log("Setting up consumer for USER_EXPORT_RESULT queue", "debug");
    const usersPromise = new Promise<UserReference[]>((resolve) => {
      channel.consume(
        "USER_EXPORT_RESULT",
        (msg) => {
          if (msg) {
            log("Received user data from USER_EXPORT_RESULT queue");
            try {
              const users = JSON.parse(msg.content.toString()) as UserReference[];
              log(`Parsed ${users.length} user references`, "debug");
              channel.ack(msg);
              resolve(users);
            } catch (error) {
              log(`Failed to parse user data: ${error.message}`, "error");
              channel.nack(msg, false, true); // Requeue the message
            }
          }
        },
        { noAck: false }
      );
    });

    // Request user export
    log("Requesting user export...");
    await channel.sendToQueue(
      "USER_EXPORT_QUEUE",
      Buffer.from(JSON.stringify({ command: "export" }))
    );
    log("User export request sent successfully", "debug");

    // Wait for response with timeout
    log("Waiting for user export response...");
    let users: UserReference[];
    try {
      users = await Promise.race([usersPromise, timeoutPromise]);
      log(`Received ${users.length} user references`);
      
      // Log first user for debugging
      if (users.length > 0) {
        log(`Sample user reference: ${JSON.stringify(users[0])}`, "debug");
      }
    } catch (error) {
      log(`Error waiting for user data: ${error.message}`, "error");
      throw error;
    }

    // Step 3: Distribute user references to other modules
    log(`Step 3: Distributing ${users.length} user references to other modules...`);

    // Send to feed module
    try {
      log("Creating FEED_SEED_QUEUE...", "debug");
      await channel.assertQueue("FEED_SEED_QUEUE", { durable: false });
      
      log(`Sending ${users.length} user references to FEED_SEED_QUEUE`, "debug");
      await channel.sendToQueue(
        "FEED_SEED_QUEUE",
        Buffer.from(JSON.stringify({ command: "seed", userReferences: users }))
      );
      log("Feed module seeding command sent successfully");
    } catch (error) {
      log(`Failed to send feed seeding command: ${error.message}`, "error");
      log(error.stack, "error");
    }

    // Wait for feed module to process
    log("Waiting for feed module processing...");
    const feedSeedingTimeout = 15000; // 15 seconds
    await new Promise((resolve) => setTimeout(resolve, feedSeedingTimeout));

    // Setup result queue for feed seeding completion
    try {
      log("Creating FEED_SEED_RESULT queue...", "debug");
      await channel.assertQueue("FEED_SEED_RESULT", { durable: false });
      
      // Set up a consumer to listen for feed seeding completion
      const feedResultPromise = new Promise<void>((resolve) => {
        channel.consume(
          "FEED_SEED_RESULT",
          (msg) => {
            if (msg) {
              log("Received feed seeding result");
              const result = JSON.parse(msg.content.toString());
              log(`Feed seeding status: ${result.status} - ${result.message}`);
              channel.ack(msg);
              resolve();
            }
          },
          { noAck: false }
        );
      });
      
      // Wait for feed result with timeout
      try {
        const feedResultTimeout = 10000; // 10 seconds
        await Promise.race([
          feedResultPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout waiting for feed seeding result")), feedResultTimeout)
          )
        ]);
      } catch (error) {
        log(`Warning: ${error.message}`, "error");
        // Continue execution even if we don't get the result
      }
    } catch (error) {
      log(`Error setting up feed result listener: ${error.message}`, "error");
      // Continue execution
    }

    // Optional: Add other modules here following the same pattern

    log("Seeding coordination complete!");
  } catch (error) {
    log(`Error during seeding process: ${error.message}`, "error");
    log(error.stack || "No stack trace available", "error");
  } finally {
    // Clean up resources
    log("Cleaning up resources...");
    
    if (channel) {
      try {
        await channel.close();
        log("RabbitMQ channel closed", "debug");
      } catch (closeError) {
        log(`Error closing channel: ${closeError.message}`, "error");
      }
    }
    
    if (connection) {
      try {
        await connection.close();
        log("RabbitMQ connection closed", "debug");
      } catch (closeError) {
        log(`Error closing connection: ${closeError.message}`, "error");
      }
    }
    
    log("Seeding process finished");
  }
}

// Execute and handle top-level errors
seedCoordinator().catch(error => {
  log(`Unhandled error in seed coordinator: ${error.message}`, "error");
  log(error.stack || "No stack trace available", "error");
  process.exit(1);
});