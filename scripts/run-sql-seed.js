const { execSync } = require("child_process");
const path = require("path");

// Get the password from command line args or use default
const password = process.argv[2] || "postgres";
const sqlFile = path.join(
  __dirname,
  "..",
  "module-feed",
  "src",
  "database",
  "seeds",
  "topic-seed.sql"
);

console.log("Attempting to seed topics...");
try {
  // Fall back to direct connection
  // Setting the password as environment variable
  const env = { ...process.env, PGPASSWORD: password };
  const directCommand = `psql -h localhost -p 5435 -U postgres -d infinivista-feed -f "${sqlFile}"`;
  console.log(`Running: ${directCommand}`);

  execSync(directCommand, {
    stdio: "inherit",
    env: env,
  });
  console.log("Topics seeded successfully through direct connection!");
} catch (secondError) {
  console.error("Failed to seed topics.");
  console.error(secondError.message);
  process.exit(1);
}
