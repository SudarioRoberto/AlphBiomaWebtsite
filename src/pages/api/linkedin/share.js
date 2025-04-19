// src/pages/api/linkedin/share.js
import { shareContent } from '../../../lib/linkedin.js';

export async function post({ request, cookies }) {
  // Verificar tokens
  const accessToken = cookies.get('linkedin_token');
  const authorId = cookies.get('linkedin_id');
  
  if (!accessToken || !authorId) {
    return new Response(JSON.stringify({ 
      error: 'Não autenticado no LinkedIn' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Obter dados do post
    const content = await request.json();
    
    // Validar dados mínimos
    if (!content.title || !content.url) {
      return new Response(JSON.stringify({ 
        error: 'Dados incompletos. Título e URL são obrigatórios.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Compartilhar no LinkedIn
    const result = await shareContent(accessToken, authorId, content);
    
    return new Response(JSON.stringify({
      success: true,
      postId: result.id,
      message: 'Post compartilhado com sucesso!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Verificar se o erro é de token expirado
    if (error.message && error.message.includes('401')) {
      // Limpar cookies
      cookies.delete('linkedin_token');
      cookies.delete('linkedin_id');
      cookies.delete('linkedin_name');
      
      return new Response(JSON.stringify({
        error: 'Sessão expirada. Por favor, reconecte ao LinkedIn.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Falha ao compartilhar no LinkedIn',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}