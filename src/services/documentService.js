import crypto from "crypto";
import { documentRepo } from "../repositories/documentRepository.js";
import { logAudit } from "../utils/auditLogger.js";
import { parseQueryParams } from "../utils/query.js";

const STATUSES = ["RECEIVED", "VALIDATED", "QUEUED", "PROCESSED", "REJECTED"];

const allowedTransitions = {
  RECEIVED: ["VALIDATED", "REJECTED"],
  VALIDATED: ["QUEUED", "REJECTED"],
  QUEUED: ["PROCESSED", "REJECTED"],
  PROCESSED: [], // locked
  REJECTED: []   // locked
};

const makeError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const documentService = {
  async createDocument(data) {
    const {
      clientReference,
      documentType,
      fileName,
      content
    } = data ?? {};

    if (!clientReference || !documentType || !fileName || content == null) {
      throw makeError("Missing required fields: clientReference, documentType, fileName, content", 400);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const doc = {
      id,
      clientReference,
      documentType,
      fileName,
      status: "RECEIVED",
      createdAt,
      updatedAt: createdAt,
      rejectionReason: null
    };

    await documentRepo.create(doc, String(content));
    await logAudit(`CREATE doc=${id} clientReference=${clientReference} type=${documentType}`);
    return doc;
  },

  async getAll(url) {
    const { clientReference, documentType, status, q } = parseQueryParams(url);

    const all = await documentRepo.getAll();

    // Filtering using modern JS array methods
    const filtered = all
      .filter(d => !clientReference || d.clientReference === clientReference)
      .filter(d => !documentType || d.documentType === documentType)
      .filter(d => !status || d.status === status)
      .filter(d => {
        if (!q) return true;
        const hay = `${d.clientReference} ${d.documentType} ${d.fileName} ${d.status}`.toLowerCase();
        return hay.includes(String(q).toLowerCase());
      });

    return {
      count: filtered.length,
      documents: filtered
    };
  },

  async getOne(id) {
    const doc = await documentRepo.getOne(id);
    if (!doc) throw makeError("Document not found", 404);
    return doc;
  },

  async getContent(id) {
    const doc = await documentRepo.getOne(id);
    if (!doc) throw makeError("Document not found", 404);
    return documentRepo.getContent(id);
  },

  async updateDocument(id, updates) {
    const existing = await documentRepo.getOne(id);
    if (!existing) throw makeError("Document not found", 404);

    if (existing.status === "PROCESSED") {
      throw makeError("PROCESSED documents cannot be modified", 409);
    }
    if (existing.status === "REJECTED") {
      throw makeError("REJECTED documents cannot be modified", 409);
    }

    const {
      clientReference,
      documentType,
      fileName,
      content
    } = updates ?? {};

    // Optional chaining + nullish coalescing usage
    const next = {
      ...existing,
      clientReference: clientReference ?? existing.clientReference,
      documentType: documentType ?? existing.documentType,
      fileName: fileName ?? existing.fileName,
      updatedAt: new Date().toISOString()
    };

    await documentRepo.update(next, content);
    await logAudit(`UPDATE doc=${id}`);
    return next;
  },

  async updateStatus(id, body) {
    const existing = await documentRepo.getOne(id);
    if (!existing) throw makeError("Document not found", 404);

    const newStatus = body?.status;
    const reason = body?.rejectionReason ?? null;

    if (!STATUSES.includes(newStatus)) {
      throw makeError(`Invalid status. Must be one of: ${STATUSES.join(", ")}`, 400);
    }

    if (existing.status === "PROCESSED") {
      throw makeError("PROCESSED documents cannot change status", 409);
    }
    if (existing.status === "REJECTED") {
      throw makeError("REJECTED documents cannot change status", 409);
    }

    const allowed = allowedTransitions[existing.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw makeError(`Invalid transition: ${existing.status} -> ${newStatus}`, 409);
    }

    if (newStatus === "REJECTED" && !reason) {
      throw makeError("REJECTED requires rejectionReason", 400);
    }

    const next = {
      ...existing,
      status: newStatus,
      rejectionReason: newStatus === "REJECTED" ? reason : null,
      updatedAt: new Date().toISOString()
    };

    await documentRepo.update(next, null);
    await logAudit(`STATUS doc=${id} ${existing.status} -> ${newStatus}`);
    return next;
  },

  async rejectDocument(id, reason) {
    const existing = await documentRepo.getOne(id);
    if (!existing) throw makeError("Document not found", 404);

    if (existing.status === "PROCESSED") {
      throw makeError("Cannot delete/reject a PROCESSED document", 409);
    }
    if (!reason) throw makeError("Deletion requires a reason", 400);

    const next = {
      ...existing,
      status: "REJECTED",
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    };

    await documentRepo.update(next, null);
    await logAudit(`DELETE->REJECT doc=${id} reason="${reason}"`);
    return next;
  },

  async generateDailyExport() {
    // Demonstrate delayed non-blocking async behavior:
    // This endpoint waits, but server can still handle other requests during the wait.
    await new Promise(resolve => setTimeout(resolve, 2500));

    const result = await documentRepo.generateDailyExport();
    await logAudit(`EXPORT daily file=${result.fileName} count=${result.count}`);
    return result;
  }
};
