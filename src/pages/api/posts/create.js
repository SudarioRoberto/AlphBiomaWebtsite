// Exemplo em src/pages/api/posts/create.js
import { createPost } from '../../../lib/posts.js';
import { shareNewPost } from '../../../lib/autoSharePost.js';

export async function post({ request }) {
  try {
    const data = await request.json();
    
    // Criar o post
    const newPost = await createPost(data);
    
    // Compartilhar automaticamente se configurado
    try {
      // Obter configurações e credenciais
      const linkedinConfig = await getLinkedInCredentials();
      
      if (linkedinConfig && linkedinConfig.autoShare) {
        // Formatar dados do post
        const postData = {
          id: newPost.id,
          title: newPost.title,
          excerpt: newPost.excerpt,
          url: `${process.env.SITE_URL}/blog/${newPost.slug}`,
        };
        
        // Compartilhar no LinkedIn
        await shareNewPost(postData, linkedinConfig.token, linkedinConfig.authorId);
      }
    } catch (shareError) {
      // Registrar erro, mas não falhar a criação do post
      console.error('Erro ao compartilhar post:', shareError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      post: newPost
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