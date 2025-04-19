// src/integrations/linkedin-publisher.js
// Este arquivo cria uma integração para publicar automaticamente posts do blog no LinkedIn

// Importações necessárias
import fetch from 'node-fetch';
import fs from 'fs';

// Inicializar variáveis de ambiente
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_AUTHOR_URN = process.env.LINKEDIN_AUTHOR_URN; // Seu LinkedIn Person URN
const SITE_URL = process.env.SITE_URL || 'https://alphabioma.com';

/**
 * Integração para publicação automática no LinkedIn
 * @returns {Object} Objeto de integração Astro
 */
export default function linkedInPublisher() {
  return {
    name: 'linkedin-publisher',
    hooks: {
      'astro:build:done': async ({ pages }) => {
        // Pular se as credenciais do LinkedIn não estiverem configuradas
        if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_AUTHOR_URN) {
          console.warn('Publicação automática no LinkedIn desativada: Faltam variáveis de ambiente LINKEDIN_ACCESS_TOKEN ou LINKEDIN_AUTHOR_URN');
          return;
        }

        // Filtrar apenas os posts de blog
        const blogPosts = pages.filter(page => page.pathname.startsWith('blog/'));
        
        console.log(`Encontrados ${blogPosts.length} posts de blog, verificando novos posts para publicar no LinkedIn...`);
        
        // Obter timestamp do último post publicado
        const lastPublishTimestamp = getLastPublishTimestamp();
        const newPosts = blogPosts.filter(post => {
          // Verificar se o post tem uma data e se é mais recente que o último post publicado
          const postDate = post.frontmatter?.date ? new Date(post.frontmatter.date) : null;
          return postDate && postDate.getTime() > lastPublishTimestamp;
        });
        
        if (newPosts.length === 0) {
          console.log('Nenhum novo post para publicar no LinkedIn');
          return;
        }
        
        console.log(`Publicando ${newPosts.length} novos posts no LinkedIn...`);
        
        // Publicar cada novo post no LinkedIn
        for (const post of newPosts) {
          try {
            await publishToLinkedIn(post);
            console.log(`Post "${post.frontmatter.title}" publicado com sucesso no LinkedIn`);
          } catch (error) {
            console.error(`Falha ao publicar "${post.frontmatter.title}" no LinkedIn:`, error);
          }
        }
        
        // Atualizar o timestamp do último post publicado
        if (newPosts.length > 0) {
          const latestPostDate = Math.max(...newPosts.map(post => new Date(post.frontmatter.date).getTime()));
          saveLastPublishTimestamp(latestPostDate);
        }
      }
    }
  };
}

/**
 * Publica um post de blog no LinkedIn
 * @param {Object} post - Post de blog a ser publicado
 * @returns {Promise<void>}
 */
async function publishToLinkedIn(post) {
  // Formatar o post do LinkedIn
  const postUrl = `${SITE_URL}/${post.pathname}`;
  
  // Criar um post do LinkedIn com conteúdo de texto e URL do blog
  const { title, excerpt } = post.frontmatter;
  
  // Criar o conteúdo do post
  const postContent = {
    author: LINKEDIN_AUTHOR_URN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: `Novo post no blog: ${title}\n\n${excerpt}\n\nLeia mais: ${postUrl} #microbioma #bioinformática #agropecuária #AlphaBioma`
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            description: {
              text: excerpt || title
            },
            originalUrl: postUrl,
            title: {
              text: title
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  try {
    // Fazer a requisição para a API do LinkedIn
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postContent)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro da API do LinkedIn: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao publicar no LinkedIn:', error);
    throw error;
  }
}

/**
 * Obtém o timestamp do último post publicado
 * @returns {number} Timestamp do último post publicado
 */
function getLastPublishTimestamp() {
  // Para uma implementação real, você deve ler isso de um banco de dados ou arquivo
  try {
    if (fs.existsSync('./.linkedin-last-publish')) {
      return parseInt(fs.readFileSync('./.linkedin-last-publish', 'utf8'), 10);
    }
  } catch (error) {
    console.warn('Erro ao ler o timestamp da última publicação:', error);
  }
  
  // Retornar 0 se nenhum timestamp for encontrado (para publicar todos os posts)
  return 0;
}

/**
 * Salva o timestamp do último post publicado
 * @param {number} timestamp - Timestamp a ser salvo
 */
function saveLastPublishTimestamp(timestamp) {
  // Para uma implementação real, você deve armazenar em um banco de dados ou arquivo
  try {
    fs.writeFileSync('./.linkedin-last-publish', timestamp.toString(), 'utf8');
  } catch (error) {
    console.warn('Erro ao salvar timestamp da última publicação:', error);
  }
}