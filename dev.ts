import { spawn } from "node:child_process";

console.log("=========================================");
console.log("   🚀 AIT - AI Chatbot Platform Starting");
console.log("=========================================");
console.log("   • Backend  -> http://localhost:3000");
console.log("   • Frontend -> http://localhost:5173");
console.log("   • API Docs -> http://localhost:3000/docs");
console.log("=========================================\n");

// Spawn backend process
const backend = spawn("bun", ["run", "dev"], {
  cwd: "./ait-backend",
  stdio: "inherit",
  shell: true,
});

// Spawn frontend process
const frontend = spawn("bun", ["run", "dev"], {
  cwd: "./ait-frontend",
  stdio: "inherit",
  shell: true,
});

function shutdown() {
  console.log("\n🛑 Shutting down all services...");
  try {
    backend.kill();
    frontend.kill();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);
