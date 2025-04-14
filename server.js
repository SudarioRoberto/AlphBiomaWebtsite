// server.js
const http = require('http');

// Usa a porta definida pelo Render
const PORT = process.env.PORT || 3000;

// Importa o app Astro compilado
const { handler } = require('./dist/server/entry.mjs');

// Cria o servidor manualmente
const server = http.createServer((req, res) => {
  handler(req, res);
});

// Inicia o servidor na porta correta
server.listen(PORT, () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
