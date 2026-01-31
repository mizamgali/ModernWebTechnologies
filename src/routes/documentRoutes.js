import { documentController } from "../controllers/documentController.js";
import { serveStatic } from "../utils/staticServer.js";

export const handleRoutes = async (req, res) => {
  const { url, method } = req;

  // Serve frontend (public)
  if (
    url === "/" ||
    url.startsWith("/public/") ||
    url.endsWith(".css") ||
    url.endsWith(".js") ||
    url.endsWith(".html")
  ) {
    return serveStatic(req, res);
  }

  // API Routes
  if (url.startsWith("/api/documents") && method === "GET") {
    // GET /api/documents (with filters)
    // GET /api/documents/:id
    // GET /api/documents/:id/content
    if (url.match(/^\/api\/documents\/[^/]+\/content(\?.*)?$/)) {
      return documentController.getContent(req, res);
    }
    if (url.match(/^\/api\/documents\/[^/]+(\?.*)?$/)) {
      return documentController.getOne(req, res);
    }
    return documentController.getAll(req, res);
  }

  if (url === "/api/documents" && method === "POST") {
    return documentController.create(req, res);
  }

  if (url.match(/^\/api\/documents\/[^/]+(\?.*)?$/) && method === "PUT") {
    return documentController.update(req, res);
  }

  if (url.match(/^\/api\/documents\/[^/]+\/status(\?.*)?$/) && method === "PATCH") {
    return documentController.updateStatus(req, res);
  }

  if (url.match(/^\/api\/documents\/[^/]+(\?.*)?$/) && method === "DELETE") {
    return documentController.remove(req, res);
  }

  if (url.startsWith("/api/exports/daily") && method === "GET") {
    return documentController.exportDaily(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
};
