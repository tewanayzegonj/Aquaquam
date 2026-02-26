import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Load DB from file
  let db = {
    categories: [],
    libraryItems: [],
    users: [],
    favorites: []
  };
  
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to parse db.json", e);
    }
  }

  // API routes FIRST
  app.use(express.json());

  app.get("/api/data", (req, res) => {
    res.json(db);
  });

  app.post("/api/data", (req, res) => {
    db = { ...db, ...req.body };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ status: "saved" });
  });

  // THEN Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        ws: false
      },
      appType: "spa",
      logLevel: "silent",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
