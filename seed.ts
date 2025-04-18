import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const modules = [
  "module-user",
  "module-feed",
  "module-communication",
  // Add other modules as needed
];

// Logging helper
function log(message: string, level: "info" | "error" | "warn" = "info") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);

  // Also log to file
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(
    path.join(logDir, "seeding.log"),
    `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
  );
}

// Execute command as promise
function execPromise(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`, "error");
        log(stderr, "error");
        reject(error);
        return;
      }
      log(stdout);
      resolve();
    });
  });
}

async function runSeeders() {
  log("Starting database seeding process...");

  // Seed each module in order (respecting dependencies)
  try {
    // First seed the user module as others depend on it
    log("Seeding user module...");
    await execPromise(
      `cd ${path.join(__dirname, "module-user")} && npm run seed`
    );

    // Then seed other modules in parallel since they depend on users
    const promises = modules
      .filter((m) => m !== "module-user")
      .map((module) => {
        log(`Seeding ${module}...`);
        return execPromise(
          `cd ${path.join(__dirname, module)} && npm run seed`
        );
      });

    await Promise.all(promises);
    log("All modules seeded successfully!");
  } catch (error) {
    log(`Seeding failed: ${error.message}`, "error");
    process.exit(1);
  }
}

runSeeders();
