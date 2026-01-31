import { documentService } from "../services/documentService.js";
import { readJsonBody } from "../utils/bodyParser.js";

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const getIdFromUrl = (reqUrl) => {
  // /api/documents/:id or /api/documents/:id/content or /api/documents/:id/status
  const parts = reqUrl.split("?")[0].split("/").filter(Boolean);
  // ["api","documents",":id", ...]
  return parts[2];
};

export const documentController = {
  async create(req, res) {
    try {
      const data = await readJsonBody(req);
      const doc = await documentService.createDocument(data);
      sendJson(res, 201, doc);
    } catch (err) {
      sendJson(res, err.statusCode ?? 400, { error: err.message ?? "Bad Request" });
    }
  },

  async getAll(req, res) {
    try {
      const docs = await documentService.getAll(req.url);
      sendJson(res, 200, docs);
    } catch (err) {
      sendJson(res, 500, { error: "Failed to fetch documents" });
    }
  },

  async getOne(req, res) {
    try {
      const id = getIdFromUrl(req.url);
      const doc = await documentService.getOne(id);
      sendJson(res, 200, doc);
    } catch (err) {
      sendJson(res, err.statusCode ?? 404, { error: err.message ?? "Not found" });
    }
  },

  async getContent(req, res) {
    try {
      const id = getIdFromUrl(req.url);
      const content = await documentService.getContent(id);
      sendJson(res, 200, { id, content });
    } catch (err) {
      sendJson(res, err.statusCode ?? 404, { error: err.message ?? "Not found" });
    }
  },

  async update(req, res) {
    try {
      const id = getIdFromUrl(req.url);
      const updates = await readJsonBody(req);
      const doc = await documentService.updateDocument(id, updates);
      sendJson(res, 200, doc);
    } catch (err) {
      sendJson(res, err.statusCode ?? 400, { error: err.message ?? "Bad Request" });
    }
  },

  async updateStatus(req, res) {
    try {
      const id = getIdFromUrl(req.url);
      const body = await readJsonBody(req);
      const doc = await documentService.updateStatus(id, body);
      sendJson(res, 200, doc);
    } catch (err) {
      sendJson(res, err.statusCode ?? 400, { error: err.message ?? "Bad Request" });
    }
  },

  async remove(req, res) {
    try {
      const id = getIdFromUrl(req.url);
      const body = await readJsonBody(req).catch(() => ({}));
      const reason = body?.reason ?? "Deleted by user";
      const doc = await documentService.rejectDocument(id, reason);
      sendJson(res, 200, doc);
    } catch (err) {
      sendJson(res, err.statusCode ?? 400, { error: err.message ?? "Bad Request" });
    }
  },

  async exportDaily(req, res) {
    try {
      const result = await documentService.generateDailyExport();
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: "Failed to generate export" });
    }
  }
};
