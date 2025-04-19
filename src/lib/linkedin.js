// src/lib/linkedin.js
/**
 * Configurações e funções para a API do LinkedIn
 */

// Configurações da API (substitua com suas credenciais reais)
export const LINKEDIN_CONFIG = {
    clientId: 'SEU_CLIENT_ID',
    clientSecret: 'SEU_CLIENT_SECRET',
    redirectUri: 'https://seusite.com/api/linkedin/callback',
    scope: 'r_liteprofile w_member_social'
  };
  
  /**
   * Constrói a URL de autorização do LinkedIn
   * @returns {string} URL de autorização
   */
  export function getAuthorizationUrl() {
    const state = Math.random().toString(36).substring(2);
    
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CONFIG.clientId}&redirect_uri=${encodeURIComponent(LINKEDIN_CONFIG.redirectUri)}&scope=${encodeURIComponent(LINKEDIN_CONFIG.scope)}&state=${state}`;
  }
  
  /**
   * Obtém token de acesso do LinkedIn usando o código de autorização
   * @param {string} code - Código de autorização
   * @returns {Promise<object>} - Objeto com token de acesso
   */
  export async function getAccessToken(code) {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: LINKEDIN_CONFIG.clientId,
          client_secret: LINKEDIN_CONFIG.clientSecret,
          redirect_uri: LINKEDIN_CONFIG.redirectUri
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao obter token: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter token LinkedIn:', error);
      throw error;
    }
  }
  
  /**
   * Obtém informações do perfil do usuário LinkedIn
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<object>} - Dados do perfil
   */
  export async function getProfileInfo(accessToken) {
    try {
      const response = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao obter perfil: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter perfil LinkedIn:', error);
      throw error;
    }
  }
  
  /**
   * Compartilha conteúdo no LinkedIn
   * @param {string} accessToken - Token de acesso
   * @param {string} authorId - ID do autor (formato urn:li:person:ID)
   * @param {object} content - Detalhes do conteúdo a ser compartilhado
   * @returns {Promise<object>} - Resultado da publicação
   */
  export async function shareContent(accessToken, authorId, content) {
    try {
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: authorId,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content.text || `Novo post no Blog AlphaBioma: ${content.title}`
              },
              shareMediaCategory: 'ARTICLE',
              media: [
                {
                  status: 'READY',
                  description: {
                    text: content.description || content.title
                  },
                  originalUrl: content.url,
                  title: {
                    text: content.title
                  }
                }
              ]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao publicar: ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao compartilhar no LinkedIn:', error);
      throw error;
    }
  }