// scripts/migrar-senhas.js
// Script para migrar senhas existentes para o novo formato
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';

// Setup para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega o .env da raiz do projeto
dotenv.config({ path: join(__dirname, '..', '.env') });

// Verifica se as variáveis de ambiente estão disponíveis
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Tenta carregar do arquivo .env manualmente se as variáveis não estiverem definidas
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n').reduce((acc, line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) acc[match[1].trim()] = match[2].trim();
      return acc;
    }, {});
    
    if (!SUPABASE_URL) console.log('SUPABASE_URL não encontrado nas variáveis de ambiente, usando do arquivo .env');
    if (!SUPABASE_KEY) console.log('SUPABASE_KEY não encontrado nas variáveis de ambiente, usando do arquivo .env');
    
    if (!SUPABASE_URL && envVars.SUPABASE_URL) {
      process.env.SUPABASE_URL = envVars.SUPABASE_URL;
    }
    
    if (!SUPABASE_KEY && (envVars.SUPABASE_KEY || envVars.SUPABASE_ANON_KEY)) {
      process.env.SUPABASE_KEY = envVars.SUPABASE_KEY || envVars.SUPABASE_ANON_KEY;
    }
  } catch (err) {
    console.error('Erro ao ler arquivo .env:', err.message);
  }
}

// Verificar novamente após tentativa de carregar do arquivo
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são necessárias.');
  console.error('Por favor, crie um arquivo .env na raiz do projeto com essas variáveis ou defina-as no ambiente.');
  process.exit(1);
}

// Senha temporária para projetos existentes
const DEFAULT_PASSWORD = 'AlphaBioma2024';

console.log('Conectando ao Supabase...');
console.log(`URL: ${process.env.SUPABASE_URL.substring(0, 20)}...`);
console.log(`KEY: ${process.env.SUPABASE_KEY.substring(0, 5)}...`);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function migratePasswords() {
  console.log('Iniciando migração de senhas...');

  // Pegar todos os projetos
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, project_id, password_hash');

  if (error) {
    console.error('Erro ao buscar projetos:', error);
    return;
  }

  console.log(`Encontrados ${projects.length} projetos para migrar`);

  // Para cada projeto, verificar e possivelmente atualizar a senha
  for (const project of projects) {
    if (!project.password_hash || project.password_hash.length < 20) {
      // Se não tem senha ou é uma senha muito curta para ser um hash bcrypt válido
      console.log(`Migrando projeto: ${project.project_id}`);
      
      // Hash com bcrypt da senha padrão
      const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
      
      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('projects')
        .update({ password_hash: passwordHash })
        .eq('id', project.id);
        
      if (updateError) {
        console.error(`Erro ao atualizar projeto ${project.project_id}:`, updateError);
      } else {
        console.log(`Projeto ${project.project_id} atualizado com sucesso`);
      }
    } else {
      console.log(`Projeto ${project.project_id} já tem hash válido, ignorando.`);
    }
  }

  console.log('Migração concluída!');
  console.log(`Senha padrão definida para projetos sem senha: ${DEFAULT_PASSWORD}`);
}

// Executar a migração
migratePasswords()
  .catch(err => {
    console.error('Erro na execução da migração:', err);
  })
  .finally(() => {
    console.log('Script finalizado.');
  });