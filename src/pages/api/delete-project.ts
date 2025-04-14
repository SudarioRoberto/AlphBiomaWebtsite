import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId } = await request.json();

    console.log('[DELETE] Requisição recebida para excluir:', projectId);

    if (!projectId) {
      console.error('[DELETE] ID do projeto não informado');
      return new Response(JSON.stringify({
        success: false,
        message: 'ID do projeto não informado.'
      }), { status: 400 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      console.error('[DELETE] Erro ao excluir no Supabase:', error);
      return new Response(JSON.stringify({
        success: false,
        message: error.message
      }), { status: 500 });
    }

    console.log('[DELETE] Projeto excluído com sucesso:', projectId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error('[DELETE] Erro inesperado:', err);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno.'
    }), { status: 500 });
  }
};
