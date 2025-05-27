const { execSync } = require("child_process");
const path = require("path");

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
