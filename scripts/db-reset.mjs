// Usuwa lokalną bazę SQLite. Przy następnym uruchomieniu aplikacja wgra treści startowe z src/content.
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.DATA_DIR || "data");
const file = path.resolve(process.env.DATABASE_PATH || path.join(dir, "app.db"));
for (const f of [file, `${file}-wal`, `${file}-shm`]) {
  if (existsSync(f)) {
    rmSync(f);
    console.log(`Usunięto ${f}`);
  }
}
console.log("Baza zostanie utworzona ponownie z treści startowych przy następnym uruchomieniu.");
