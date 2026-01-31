export const readJsonBody = async (req) => {
  let raw = "";

  // Stream-based input handling using async iterator
  for await (const chunk of req) {
    raw += chunk.toString("utf-8");
  }

  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error("Invalid JSON body");
    err.statusCode = 400;
    throw err;
  }
};
