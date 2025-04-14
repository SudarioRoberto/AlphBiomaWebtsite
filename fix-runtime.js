import fs from 'fs';
import path from 'path';

const configPath = path.resolve('.vercel/output/functions/render.func/config.json');

// Aguarda o arquivo existir com timeout de até 5 segundos
function waitForFile(filePath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (fs.existsSync(filePath)) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout: config.json não encontrado.'));
      } else {
        setTimeout(check, 250);
      }
    };

    check();
  });
}

try {
  await waitForFile(configPath);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  config.runtime = 'nodejs@18.20.2';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Runtime corrigido com sucesso para nodejs@18.20.2');
} catch (err) {
  console.error('❌ Erro ao corrigir runtime:', err);
}
