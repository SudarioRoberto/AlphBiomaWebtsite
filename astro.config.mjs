import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import sitemap from 'astro-sitemap';
import linkedInPublisher from './src/integrations/linkedin-publisher.js';

export default defineConfig({
  site: 'https://www.alphabioma.com', // Seu domínio real
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  experimental: {
    session: true
  },
  integrations: [
    mdx(),
    sitemap({
      // Aqui listamos manualmente todas as rotas do seu site
      customPages: [
        'https://www.alphabioma.com/',
        'https://www.alphabioma.com/microbioma',
        'https://www.alphabioma.com/dados',
        'https://www.alphabioma.com/blog',
        'https://www.alphabioma.com/aplicativos',
        // Adicione todas as outras páginas do seu site
        // Se tiver muitas páginas de blog, você pode adicionar desta forma:
        // 'https://www.alphabioma.com/blog/post1',
        // 'https://www.alphabioma.com/blog/post2',
      ],
      // Configurações opcionais
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Excluir áreas administrativas (opcional se já estiver usando customPages)
      filter: (page) => !page.includes('/admin/'),
    }),
    // Integração LinkedIn Publisher
    linkedInPublisher()
  ],
  // Vite config para definir variáveis de ambiente públicas
  vite: {
    define: {
      'import.meta.env.PUBLIC_SITE_URL': JSON.stringify(process.env.SITE_URL || 'https://www.alphabioma.com')
    }
  }
});