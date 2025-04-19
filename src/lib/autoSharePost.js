// src/lib/autoSharePost.js
import { shareContent } from './linkedin.js';
import fs from 'node:fs/promises';
import path from 'node:path';

// Função para compartilhar um novo post
export async function shareNewPost(postData, token, authorId) {
  try {
    // Verificar se o compartilhamento automático está ativado
    const autoShare = process.env.LINKEDIN_AUTO_SHARE === 'true' || true;
    if (!autoShare) return { success: false, message: 'Compartilhamento automático desativado' };
    
    // Verificar token e autor
    if (!token || !authorId) {
      return { 
        success: false, 
        message: 'Sem credenciais do LinkedIn para compartilhamento automático'
        // src/lib/autoSharePost.js (continuação)
    
    // Preparar dados para compartilhamento
    const content = {
        title: postData.title,
        url: postData.url, // URL completa do post
        description: postData.excerpt || postData.title,
        text: createShareText(postData)
      };
      
      // Compartilhar no LinkedIn
      const result = await shareContent(token, authorId, content);
      
      // Registrar compartilhamento
      await logSharing({
        post_id: postData.id,
        platform: 'linkedin',
        status: 'success',
        linkedin_post_id: result.id,
        shared_at: new Date().toISOString()
      });
      
      return {
        success: true,
        linkedin_post_id: result.id,
        message: 'Post compartilhado automaticamente no LinkedIn'
      };
    } catch (error) {
      console.error('Erro ao compartilhar automaticamente:', error);
      
      // Registrar falha
      await logSharing({
        post_id: postData.id,
        platform: 'linkedin',
        status: 'failed',
        error: error.message,
        shared_at: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Criar texto de compartilhamento usando o modelo definido
  function createShareText(postData) {
    // Obter o modelo de mensagem (de configurações ou usar padrão)
    let template = process.env.LINKEDIN_MESSAGE_TEMPLATE || 
      'Novo post no Blog AlphaBioma: {title}\n\nDescubra mais sobre microbioma e análise de dados para produção animal. Leia o artigo completo: {url}';
    
    // Substituir as variáveis no template
    return template
      .replace('{title}', postData.title)
      .replace('{url}', postData.url)
      .replace('{excerpt}', postData.excerpt || '');
  }
  
  // Registrar o compartilhamento (para fins de acompanhamento)
  async function logSharing(data) {
    // Isso pode ser implementado para salvar em arquivo JSON ou banco de dados
    // Exemplo simplificado com arquivo JSON
    try {
      const logFile = path.join(process.cwd(), 'data', 'share-log.json');
      
      // Verificar se o arquivo existe
      let logs = [];
      try {
        const existingData = await fs.readFile(logFile, 'utf-8');
        logs = JSON.parse(existingData);
      } catch (err) {
        // Arquivo não existe, criar novo array
      }
      
      // Adicionar novo log
      logs.push(data);
      
      // Salvar arquivo
      await fs.mkdir(path.dirname(logFile), { recursive: true });
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
      console.error('Erro ao registrar compartilhamento:', error);
    }
  }