import path from "path";
import fs from "fs/promises";
import { ensureDir, readJsonFile, writeJsonFile } from "../utils/fileUtils.js";

const ROOT = process.cwd();

const DATA_DIR = path.join(ROOT, "data");
const DOCS_DIR = path.join(ROOT, "documents");
const EXPORTS_DIR = path.join(ROOT, "exports");

const META_FILE = path.join(DATA_DIR, "documents.json");

const contentPath = (id) => path.join(DOCS_DIR, `${id}.txt`);

const todayStr = () => new Date().toISOString().slice(0, 10);

const sortByCreatedAtDesc = (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "");

export const documentRepo = {
  async init() {
    await ensureDir(DATA_DIR);
    await ensureDir(DOCS_DIR);
    await ensureDir(EXPORTS_DIR);

    // Create metadata file if missing
    try {
      await fs.access(META_FILE);
    } catch {
      await writeJsonFile(META_FILE, []);
    }
  },

  async getAll() {
    await this.init();
    const docs = await readJsonFile(META_FILE, []);
    return [...docs].sort(sortByCreatedAtDesc);
  },

  async getOne(id) {
    await this.init();
    const docs = await readJsonFile(META_FILE, []);
    return docs.find(d => d.id === id) ?? null;
  },

  async create(meta, content) {
    await this.init();

    const docs = await readJsonFile(META_FILE, []);
    const nextDocs = [...docs, meta];

    // Save metadata + content (separate file)
    await writeJsonFile(META_FILE, nextDocs);
    await fs.writeFile(contentPath(meta.id), content ?? "", "utf-8");
  },

  async getContent(id) {
    await this.init();
    return fs.readFile(contentPath(id), "utf-8");
  },

  async update(nextMeta, maybeNewContent) {
    await this.init();

    const docs = await readJsonFile(META_FILE, []);
    const idx = docs.findIndex(d => d.id === nextMeta.id);

    if (idx === -1) return null;

    const updated = docs.map(d => (d.id === nextMeta.id ? nextMeta : d));
    await writeJsonFile(META_FILE, updated);

    // If content is provided (even empty string), replace content file
    if (maybeNewContent !== null && maybeNewContent !== undefined) {
      await fs.writeFile(contentPath(nextMeta.id), String(maybeNewContent), "utf-8");
    }

    return nextMeta;
  },

  async generateDailyExport() {
    await this.init();

    const docs = await readJsonFile(META_FILE, []);
    const date = todayStr();
    const fileName = `daily-export-${date}.json`;
    const exportPath = path.join(EXPORTS_DIR, fileName);

    const payload = {
      date,
      count: docs.length,
      documents: docs
    };

    await fs.writeFile(exportPath, JSON.stringify(payload, null, 2), "utf-8");

    return {
      date,
      count: docs.length,
      fileName
    };
  }
};
