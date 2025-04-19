// src/pages/api/linkedin/callback.js
import { getAccessToken, getProfileInfo } from '../../../lib/linkedin.js';

export async function get({ request, redirect, cookies }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error) {
    console.error('Erro na autenticação LinkedIn:', error);
    return redirect('/admin/linkedin?error=' + encodeURIComponent(error));
  }
  
  if (!code) {
    return redirect('/admin/linkedin?error=no_code');
  }
  
  try {
    // Obter token de acesso
    const tokenData = await getAccessToken(code);
    
    // Obter informações do perfil
    const profileData = await getProfileInfo(tokenData.access_token);
    
    // Armazenar em cookies (em produção, considere armazenar em banco de dados)
    const expiresIn = tokenData.expires_in || 3600;
    
    cookies.set('linkedin_token', tokenData.access_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: expiresIn
    });
    
    cookies.set('linkedin_id', `urn:li:person:${profileData.id}`, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: expiresIn
    });
    
    // Armazenar dados adicionais se necessário
    cookies.set('linkedin_name', profileData.localizedFirstName + ' ' + profileData.localizedLastName, {
      path: '/',
      httpOnly: false, // Para poder mostrar na interface
      secure: true,
      maxAge: expiresIn
    });
    
    return redirect('/admin/linkedin?success=true');
  } catch (error) {
    console.error('Erro ao processar callback:', error);
    return redirect('/admin/linkedin?error=' + encodeURIComponent(error.message));
  }
}