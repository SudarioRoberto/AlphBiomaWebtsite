// src/pages/api/cron/check-posts.js
import { checkForNewPosts } from '../../../hooks/postPublishHook.js';

export async function get({ request }) {
  // Verificar autenticação (opcional)
  // const authHeader = request.headers.get('Authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }
  
  try {
    await checkForNewPosts();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Verificação de posts concluída'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}