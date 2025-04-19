// src/pages/api/linkedin-callback.js
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

export async function GET({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  // Verificar erros
  if (url.searchParams.get('error')) {
    return new Response(`Erro de autenticação: ${url.searchParams.get('error_description')}`, {
      status: 400
    });
  }
  
  // Verificar se o código está presente
  if (!code) {
    return new Response('Código de autorização ausente', { status: 400 });
  }
  
  // Verificar se as credenciais do LinkedIn estão configuradas
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    return new Response('Erro: Credenciais do LinkedIn não configuradas nas variáveis de ambiente', {
      status: 500
    });
  }
  
  try {
    // Trocar o código de autorização por um token de acesso
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Falha ao trocar código por token: ${errorData}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Obter o perfil do usuário para obter o LinkedIn URN
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      throw new Error(`Falha ao obter perfil do usuário: ${errorData}`);
    }
    
    const profileData = await profileResponse.json();
    
    // Armazenar os tokens e dados do perfil (se o Supabase estiver configurado)
    if (supabase) {
      await supabase
        .from('linkedin_tokens')
        .upsert([
          {
            user_id: profileData.id,
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            refresh_token: tokenData.refresh_token,
            created_at: new Date().toISOString(),
            profile_data: profileData
          }
        ]);
      
      console.log('Tokens armazenados no Supabase com sucesso');
    } else {
      // Se não estiver usando Supabase, você precisará armazenar esses tokens em algum lugar
      console.log('Autenticação LinkedIn bem-sucedida, mas nenhum banco de dados configurado para armazenar tokens');
      console.log('Dados do token:', tokenData);
      console.log('Dados do perfil:', profileData);
    }
    
    // Gerar uma resposta com instruções
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticação LinkedIn bem-sucedida</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f5f5f5;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
          }
          pre {
            background-color: #eee;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
          }
          h1 { color: #0077b5; }
          .success { color: green; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Autenticação LinkedIn bem-sucedida!</h1>
          <p class="success">Sua conta LinkedIn foi conectada com sucesso à AlphaBioma.</p>
          
          <h2>Próximos passos:</h2>
          <p>Para completar a configuração, adicione as seguintes variáveis de ambiente ao seu projeto Astro:</p>
          
          <pre>
LINKEDIN_ACCESS_TOKEN=${tokenData.access_token}
LINKEDIN_AUTHOR_URN=urn:li:person:${profileData.id}
          </pre>
          
          <p>Adicione-as ao seu arquivo .env ou às variáveis de ambiente do seu servidor.</p>
          
          <p>O token de acesso expirará em ${Math.floor(tokenData.expires_in / 60 / 60)} horas. 
             Para uso em produção, você precisará implementar a funcionalidade de renovação de token.</p>
          
          <p><a href="/">Voltar para a página inicial</a></p>
        </div>
      </body>
      </html>
    `;
    
    return new Response(htmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
    
  } catch (error) {
    console.error('Erro de callback LinkedIn:', error);
    return new Response(`Erro de autenticação: ${error.message}`, {
      status: 500
    });
  }
}