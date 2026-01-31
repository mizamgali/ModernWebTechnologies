import path from "path";
import fs from "fs/promises";
import { ensureDir } from "./fileUtils.js";

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "audit.log");

export const logAudit = async (message) => {
  await ensureDir(LOG_DIR);
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await fs.appendFile(LOG_FILE, line, "utf-8");
};
