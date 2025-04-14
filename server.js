// server.js (versão ESModule)
import http from 'http';
import { handler } from './dist/server/entry.mjs';

const PORT = process.env.PORT || 3000;

const server = http.createServer(handler);

server.listen(PORT, () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
