// src/pages/api/linkedin/disconnect.js
export async function get({ redirect, cookies }) {
    // Remover cookies do LinkedIn
    cookies.delete('linkedin_token');
    cookies.delete('linkedin_id');
    cookies.delete('linkedin_name');
    
    // Redirecionar de volta para a página de administração
    return redirect('/admin/linkedin');
  }