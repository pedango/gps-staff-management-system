// scripts/performance/run.ts
// ============================================================================
// AUTORESEARCH TEST ORCHESTRATOR
// Builds the app, starts the server, waits for it to be ready, runs the
// performance measurement harness, then shuts the server down.
// Cross-platform: no shell-specific backgrounding/sleep syntax.
// ============================================================================

import { spawn, execSync, type ChildProcess } from "node:child_process";
import { measurePerformance } from "./measure";

const PORT = process.env.PORT || "3000";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 60_000;
const READY_POLL_INTERVAL_MS = 500;

function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        await fetch(url);
        resolve();
        return;
      } catch {
        // server not up yet
      }
      if (Date.now() > deadline) {
        reject(new Error(`Server did not become ready within ${timeoutMs}ms`));
        return;
      }
      setTimeout(attempt, READY_POLL_INTERVAL_MS);
    };
    attempt();
  });
}

function killProcessTree(server: ChildProcess) {
  if (server.killed || server.pid === undefined) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    } catch {
      // already exited
    }
  } else {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      try {
        server.kill("SIGTERM");
      } catch {
        // already exited
      }
    }
  }
}

async function main() {
  console.log("[autoresearch] Building...");
  execSync("npm run build", { stdio: "inherit" });

  console.log("[autoresearch] Starting server...");
  const server = spawn("npm", ["run", "start"], {
    stdio: "inherit",
    shell: true,
    detached: process.platform !== "win32",
  });

  const cleanup = () => killProcessTree(server);
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(1);
  });

  try {
    console.log(`[autoresearch] Waiting for ${BASE_URL} to be ready...`);
    await waitForServer(BASE_URL, READY_TIMEOUT_MS);

    console.log("[autoresearch] Running performance measurement...");
    await measurePerformance();
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
