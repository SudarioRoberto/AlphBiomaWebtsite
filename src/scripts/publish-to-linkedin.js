// src/scripts/publish-to-linkedin.js
// Script para publicação manual de posts do blog no LinkedIn
// Execute com: node src/scripts/publish-to-linkedin.js --post="caminho/para/post.md"

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { parseArgs } from 'node:util';
import matter from 'gray-matter';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar variáveis de ambiente necessárias
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_AUTHOR_URN = process.env.LINKEDIN_AUTHOR_URN;
const SITE_URL = process.env.SITE_URL || 'https://alphabioma.com';

if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_AUTHOR_URN) {
  console.error('Erro: Variáveis de ambiente LINKEDIN_ACCESS_TOKEN e LINKEDIN_AUTHOR_URN são obrigatórias');
  process.exit(1);
}

// Analisar argumentos da linha de comando
const { values } = parseArgs({
  options: {
    post: { type: 'string' },
    all: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    dry: { type: 'boolean' } // Modo de teste que não faz publicação real
  }
});

// Mostrar ajuda
if (values.help) {
  console.log(`
Publicação de posts do blog no LinkedIn

Uso:
  node src/scripts/publish-to-linkedin.js [options]

Opções:
  --post="path/to/post.md"  Publicar um post específico
  --all                     Publicar todos os posts não publicados
  --dry                     Executar em modo de teste (sem publicação real)
  --help, -h                Mostrar esta ajuda
  `);
  process.exit(0);
}

/**
 * Extrai metadados e conteúdo de um arquivo Markdown
 * @param {string} filePath - Caminho para o arquivo Markdown
 * @returns {Object} - Metadados e conteúdo do post
 */
function extractPostData(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    // Verificar se tem os campos necessários
    if (!data.title) {
      console.warn(`Aviso: Post sem título: ${filePath}`);
      data.title = path.basename(filePath, path.extname(filePath));
    }
    
    if (!data.date) {
      console.warn(`Aviso: Post sem data: ${filePath}`);
      data.date = new Date().toISOString();
    }
    
    // Gerar um excerpt se não existir
    if (!data.excerpt) {
      // Remover marcações Markdown e limitar a 160 caracteres
      const plainText = content
        .replace(/\n/g, ' ')
        .replace(/#|```|\*\*|\*|__|\[|\]\(.*?\)/g, '')
        .trim();
      data.excerpt = plainText.substring(0, 160) + (plainText.length > 160 ? '...' : '');
    }
    
    // Determinar o slug do post (para URL)
    if (!data.slug) {
      data.slug = path.basename(filePath, path.extname(filePath))
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }
    
    return {
      meta: data,
      content,
      filePath
    };
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    return null;
  }
}

/**
 * Publica um post no LinkedIn
 * @param {Object} post - Dados do post
 * @returns {Promise<Object>} - Resposta da API do LinkedIn
 */
async function publishToLinkedIn(post) {
  const { meta } = post;
  
  // Construir a URL do post
  const postUrl = `${SITE_URL}/blog/${meta.slug}`;
  
  // Criar o conteúdo para a publicação no LinkedIn
  const postContent = {
    author: LINKEDIN_AUTHOR_URN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: `Novo post no blog: ${meta.title}\n\n${meta.excerpt}\n\nLeia mais: ${postUrl} #microbioma #bioinformática #agropecuária #AlphaBioma`
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            description: {
              text: meta.excerpt || meta.title
            },
            originalUrl: postUrl,
            title: {
              text: meta.title
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  // Se estiver no modo de teste, apenas mostrar o que seria postado
  if (values.dry) {
    console.log('MODO DE TESTE - O post seria publicado com o seguinte conteúdo:');
    console.log(JSON.stringify(postContent, null, 2));
    return { success: true, mode: 'dry-run' };
  }
  
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
 * Função principal
 */
async function main() {
  try {
    if (values.post) {
      // Publicar um post específico
      const postPath = values.post;
      
      if (!fs.existsSync(postPath)) {
        console.error(`Erro: Arquivo não encontrado: ${postPath}`);
        process.exit(1);
      }
      
      const post = extractPostData(postPath);
      if (!post) {
        console.error(`Erro: Não foi possível extrair dados do post: ${postPath}`);
        process.exit(1);
      }
      
      console.log(`Publicando post: ${post.meta.title}`);
      const result = await publishToLinkedIn(post);
      
      if (values.dry) {
        console.log('Publicação simulada com sucesso (modo de teste)');
      } else {
        console.log(`Post publicado com sucesso no LinkedIn! ID: ${result.id}`);
        
        // Salvar ID da publicação no frontmatter do post para referência futura
        if (result.id) {
          const updatedFrontmatter = { 
            ...post.meta, 
            linkedin_post_id: result.id,
            linkedin_published_at: new Date().toISOString() 
          };
          
          const fileContent = matter.stringify(post.content, updatedFrontmatter);
          fs.writeFileSync(post.filePath, fileContent, 'utf8');
          console.log(`Metadata do post atualizado com ID do LinkedIn`);
        }
      }
    } else if (values.all) {
      // Publicar todos os posts não publicados ainda
      const blogDir = path.join(process.cwd(), 'src/content/blog'); // Ajuste conforme estrutura do projeto
      
      if (!fs.existsSync(blogDir)) {
        console.error(`Erro: Diretório de blog não encontrado: ${blogDir}`);
        process.exit(1);
      }
      
      // Ler todos os arquivos .md e .mdx no diretório do blog
      const files = fs.readdirSync(blogDir)
        .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
        .map(file => path.join(blogDir, file));
      
      console.log(`Encontrados ${files.length} posts no blog`);
      
      // Filtrar apenas os que ainda não foram publicados no LinkedIn
      const postsToPublish = [];
      
      for (const file of files) {
        const post = extractPostData(file);
        if (post && !post.meta.linkedin_post_id) {
          postsToPublish.push(post);
        }
      }
      
      console.log(`${postsToPublish.length} posts para publicar no LinkedIn`);
      
      // Publicar cada post, um após o outro
      for (const post of postsToPublish) {
        console.log(`Publicando: ${post.meta.title}`);
        
        try {
          const result = await publishToLinkedIn(post);
          
          if (values.dry) {
            console.log('Publicação simulada com sucesso (modo de teste)');
          } else {
            console.log(`Post publicado com sucesso no LinkedIn! ID: ${result.id}`);
            
            // Salvar ID da publicação no frontmatter do post
            if (result.id) {
              const updatedFrontmatter = {
                ...post.meta,
                linkedin_post_id: result.id,
                linkedin_published_at: new Date().toISOString()
              };
              
              const fileContent = matter.stringify(post.content, updatedFrontmatter);
              fs.writeFileSync(post.filePath, fileContent, 'utf8');
              console.log(`Metadata do post atualizado com ID do LinkedIn`);
            }
          }
          
          // Esperar um pouco entre as publicações para evitar limitações de API
          if (!values.dry && postsToPublish.length > 1) {
            console.log('Aguardando 5 segundos antes da próxima publicação...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (error) {
          console.error(`Erro ao publicar ${post.meta.title}:`, error);
          // Continuar para o próximo post mesmo se houver erro
        }
      }
      
      console.log('Processo de publicação concluído!');
    } else {
      console.error('Erro: Especifique --post="caminho/para/arquivo.md" ou --all');
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro durante a execução:', error);
    process.exit(1);
  }
}

// Executar o script
main();