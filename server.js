const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "cat123";

// Set en memoria para llaves activas de un solo uso
const validAccessKeys = new Set();

app.get("/ksdgeneratorsecret", (req, res) => {
  res.sendFile(path.join(__dirname, "ksdgeneratorsecret.html"));
});

// Endpoint: Generar llave única
app.post("/api/generate-key", (req, res) => {
  const { password } = req.body;

  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: "Contraseña maestra incorrecta." });
  }

  const newKey = "AETH-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  validAccessKeys.add(newKey); // Se guarda la llave

  res.json({ success: true, key: newKey });
});

// Endpoint: Verificar y CONSUMIR la llave (1 solo uso estricto)
app.post("/api/verify-key", (req, res) => {
  const { key } = req.body;

  if (validAccessKeys.has(key)) {
    validAccessKeys.delete(key); // DESTRUCCIÓN INMEDIATA
    return res.json({ valid: true });
  }

  res.status(400).json({ valid: false, error: "Llave inválida o ya fue usada." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Aethery Server activo en puerto ${PORT}`);
});
