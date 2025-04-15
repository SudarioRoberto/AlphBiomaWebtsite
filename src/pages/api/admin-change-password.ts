import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { projectId, newPassword } = await request.json();

  const cleanId = projectId?.trim();  // 🧼 Remove espaços

  console.log('[DEBUG] ID recebido:', cleanId); // <-- veja no terminal!

  if (!cleanId || !newPassword) {
    return new Response(
      JSON.stringify({ success: false, message: 'ID do projeto e nova senha são obrigatórios.' }),
      { status: 400 }
    );
  }

  const { error } = await supabase.rpc('update_project_password', {
    p_project_id: cleanId,
    p_new_password: newPassword,
  });

  if (error) {
    console.error('[SUPABASE ERROR]', error); // Adicione isso
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Erro ao atualizar a senha.' }),
      { status: 500 }
    );
  }
  

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
