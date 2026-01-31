import http from "http";
import { handleRoutes } from "./routes/documentRoutes.js";

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  try {
    await handleRoutes(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
