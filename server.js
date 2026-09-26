const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS) desde la raíz
app.use(express.static(path.join(__dirname)));

// Contraseña Maestra para generar llaves de acceso
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "cat123";

// Almacén en memoria de llaves de uso único
const validAccessKeys = new Set();

// Ruta Secreta para el Generador
app.get("/ksdgeneratorsecret", (req, res) => {
  res.sendFile(path.join(__dirname, "ksdgeneratorsecret.html"));
});

// Endpoint 1: Generar una llave única
app.post("/api/generate-key", (req, res) => {
  const { password } = req.body;

  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: "Contraseña maestra incorrecta." });
  }

  const newKey = "AETH-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  validAccessKeys.add(newKey);

  res.json({ success: true, key: newKey });
});

// Endpoint 2: Validar y consumir la llave única
app.post("/api/verify-key", (req, res) => {
  const { key } = req.body;

  if (validAccessKeys.has(key)) {
    validAccessKeys.delete(key); // Se destruye inmediatamente tras usarse
    return res.json({ valid: true });
  }

  res.status(400).json({ valid: false, error: "Llave inválida o ya utilizada." });
});

// Cualquier otra ruta entrega la portada principal (index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor de Aethery activo en puerto ${PORT}`);
});
