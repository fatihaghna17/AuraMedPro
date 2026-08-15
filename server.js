// server.ts
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
var db;
async function initDb() {
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  db = await open({
    filename: path.join(dataDir, "cbt.db"),
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS question_banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      questions_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Database SQLite berhasil diinisialisasi.");
}
app.get("/api/questions", async (req, res) => {
  try {
    const rows = await db.all("SELECT name, questions_json FROM question_banks");
    const result = {};
    for (const row of rows) {
      try {
        result[row.name] = JSON.parse(row.questions_json);
      } catch (err) {
        result[row.name] = [];
      }
    }
    res.json(result);
  } catch (error) {
    console.error("Gagal mengambil data soal:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/questions", async (req, res) => {
  const { name, questions } = req.body;
  if (!name || !Array.isArray(questions)) {
    return res.status(400).json({ error: "Nama bank soal atau array pertanyaan tidak valid" });
  }
  try {
    const questionsJson = JSON.stringify(questions);
    await db.run(
      `INSERT INTO question_banks (name, questions_json) 
       VALUES (?, ?) 
       ON CONFLICT(name) DO UPDATE SET questions_json = excluded.questions_json`,
      [name, questionsJson]
    );
    res.json({ success: true, message: `Bank soal '${name}' berhasil disimpan.` });
  } catch (error) {
    console.error("Gagal menyimpan bank soal:", error);
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/questions/:name", async (req, res) => {
  const { name } = req.params;
  try {
    await db.run("DELETE FROM question_banks WHERE name = ?", [name]);
    res.json({ success: true, message: `Bank soal '${name}' berhasil dihapus.` });
  } catch (error) {
    console.error("Gagal menghapus bank soal:", error);
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/questions", async (req, res) => {
  try {
    await db.run("DELETE FROM question_banks");
    res.json({ success: true, message: "Seluruh bank soal berhasil dihapus." });
  } catch (error) {
    console.error("Gagal membersihkan database:", error);
    res.status(500).json({ error: error.message });
  }
});
var distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
var PORT = process.env.PORT || 3001;
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server Express berjalan di port ${PORT}`);
  });
}).catch((err) => {
  console.error("Inisialisasi database gagal:", err);
});
