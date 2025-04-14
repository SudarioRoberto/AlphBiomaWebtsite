import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const id = form.get('id')?.toString();

  if (!id) return new Response('Project ID ausente', { status: 400 });

  const { error: deleteSamplesError } = await supabase
    .from('samples')
    .delete()
    .eq('project_id', id);

  if (deleteSamplesError) {
    console.error(deleteSamplesError);
    return new Response('Erro ao excluir amostras do projeto', { status: 500 });
  }

  const { error: deleteProjectError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (deleteProjectError) {
    console.error(deleteProjectError);
    return new Response('Erro ao excluir projeto', { status: 500 });
  }

  return Response.redirect(new URL('/admin', request.url), 303);
};
