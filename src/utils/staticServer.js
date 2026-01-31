import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");

const contentType = (filePath) => {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js")) return "text/javascript";
  return "application/octet-stream";
};

export const serveStatic = async (req, res) => {
  const reqPath = req.url === "/" ? "/index.html" : req.url;
  const clean = reqPath.replace("/public", ""); // allow /public/script.js or /script.js
  const filePath = path.join(PUBLIC, clean);

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
};
