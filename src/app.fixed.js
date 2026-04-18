// ============================================================
// app.fixed.js — aplicação web CORRIGIDA (versão segura)
// ============================================================

const express  = require('express');
const mysql    = require('mysql2');
const { execFile } = require('child_process');
const he       = require('he');
const path     = require('path');
const app      = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORREÇÃO 1 — Segredos via variáveis de ambiente
const API_SECRET  = process.env.API_SECRET;
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!API_SECRET || !DB_PASSWORD) {
  console.error('ERRO: variáveis de ambiente obrigatórias não definidas.');
  process.exit(1);
}

// CORREÇÃO 2 — Prepared Statements contra SQL Injection
app.get('/user', (req, res) => {
  const db     = mysql.createConnection({ password: DB_PASSWORD });
  const userId = req.query.id;
  const query  = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro interno' });
    res.json(results);
  });
});

// CORREÇÃO 3 — execFile() + validação contra Command Injection
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

app.post('/convert', (req, res) => {
  const filename = path.basename(req.body.filename);
  const ext      = path.extname(filename).toLowerCase();

  if (!ALLOWED_EXT.includes(ext)) {
    return res.status(400).json({ error: 'Extensão não permitida.' });
  }

  execFile('convert', [filename, 'output.pdf'], (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Falha na conversão.' });
    res.send(stdout);
  });
});

// CORREÇÃO 4 — Escape de HTML contra XSS Refletido
app.get('/search', (req, res) => {
  const q = he.encode(req.query.q ?? '');
  res.send(`<html><body><h1>Resultados para: ${q}</h1></body></html>`);
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
