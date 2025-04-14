// Define a porta a partir da variável de ambiente (Render exige isso)
const port = process.env.PORT || 3000;

// Executa o servidor Astro gerado, passando a porta correta
import('astro:server').then(async ({ start }) => {
  const { handler } = await import('./dist/server/entry.mjs');
  start(handler, { port });
});
