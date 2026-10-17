// Serwer do testów E2E: osobna, świeża baza w katalogu tymczasowym, build produkcyjny.
import { spawnSync, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const port = process.argv[2] || "3200";
const dir = mkdtempSync(path.join(tmpdir(), "ip-e2e-"));
const env = { ...process.env, IP_BUILD_DB: "memory", DATA_DIR: dir, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`, ADMIN_PASSWORD: "test-haslo-e2e", ADMIN_SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-123" };
if (!process.env.E2E_SKIP_BUILD) {
  const b = spawnSync("npx", ["next", "build"], { stdio: "inherit", env });
  if (b.status !== 0) process.exit(b.status ?? 1);
}
const s = spawn("npx", ["next", "start", "-p", port], { stdio: "inherit", env });
const stop = () => s.kill("SIGTERM");
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
s.on("exit", (c) => process.exit(c ?? 0));
