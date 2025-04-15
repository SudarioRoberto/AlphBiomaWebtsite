import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

console.log('📊 Conectando ao Supabase...');
console.log('URL:', supabaseUrl?.slice(0, 20) + '...');
console.log('Key:', supabaseKey?.slice(0, 5) + '...');

// Aplicar configuração otimizada para operações mais robustas
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Não persistir a sessão em armazenamento local
    autoRefreshToken: false // Não atualizar token automaticamente
  },
  // Configurações globais para melhorar consistência
  global: {
    fetch: (...args) => fetch(...args)
  },
  // Aumentar timeout para operações complexas
  realtime: {
    timeout: 30000 // 30 segundos
  }
});

// Função utilitária para debug
export const logSupabaseResponse = (operation, error, data) => {
  if (error) {
    console.error(`❌ Erro Supabase (${operation}):`, error);
    return false;
  }
  
  console.log(`✅ Supabase (${operation}):`, data ? 'Dados recebidos' : 'Operação concluída');
  return true;
};

// Função para verificar se a conexão está funcionando
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    return { success: true, message: 'Conexão Supabase funcionando!' };
  } catch (error) {
    console.error('Erro ao testar conexão Supabase:', error);
    return { success: false, message: error.message || 'Falha na conexão' };
  }
}