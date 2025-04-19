// src/pages/api/linkedin-auth.js
// Este arquivo deve ser colocado no diretório src/pages/api do seu projeto Astro

export const prerender = false; // Garantir que isso seja executado no servidor

// LinkedIn OAuth credentials
// Isso deve ser definido em suas variáveis de ambiente
const LINKEDIN_CLIENT_ID = import.meta.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = import.meta.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.REDIRECT_URI || 'http://localhost:3000/api/linkedin-callback';

// Inicializar Supabase somente se as credenciais estiverem disponíveis
let supabase = null;
try {
  // Importação dinâmica para evitar erros quando o módulo não está disponível
  if (import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_KEY
    );
  }
} catch (error) {
  console.warn('Aviso: Supabase não inicializado -', error.message);
}

export async function GET() {
  // Verificar se as credenciais do LinkedIn estão configuradas
  if (!LINKEDIN_CLIENT_ID) {
    return new Response('Erro: LINKEDIN_CLIENT_ID não está configurado nas variáveis de ambiente', {
      status: 500
    });
  }

  // Criar a URL de autorização do LinkedIn
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', LINKEDIN_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', generateRandomState());
  authUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social');

  // Redirecionar para o LinkedIn para autenticação
  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString()
    }
  });
}

/**
 * Gera um parâmetro state aleatório para segurança OAuth
 */
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}