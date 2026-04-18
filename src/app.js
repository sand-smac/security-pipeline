// ============================================================
// app.js — aplicação web vulnerável (versão inicial, sem patch)
// Este arquivo contém vulnerabilidades INTENCIONAIS para fins
// didáticos. NÃO use este código em produção.
// ============================================================

const express = require('express');
const mysql   = require('mysql2');
const { exec } = require('child_process');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// VULNERABILIDADE 1 — Segredo hardcoded
const API_SECRET = "ghp_hardcodedSecretToken1234567890abcd";
const DB_PASSWORD = "admin123";

// VULNERABILIDADE 2 — SQL Injection
app.get('/user', (req, res) => {
  const db = mysql.createConnection({ password: DB_PASSWORD });
  const userId = req.query.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// VULNERABILIDADE 3 — Command Injection
app.post('/convert', (req, res) => {
  const filename = req.body.filename;
  exec(`convert ${filename} output.pdf`, (err, stdout) => {
    res.send(stdout);
  });
});

// VULNERABILIDADE 4 — XSS Refletido
app.get('/search', (req, res) => {
  const q = req.query.q;
  res.send(`<html><body><h1>Resultados para: ${q}</h1></body></html>`);
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
