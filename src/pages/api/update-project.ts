import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const id = form.get('id')?.toString();
  const name = form.get('name')?.toString().trim();
  const description = form.get('description')?.toString().trim();
  const status = form.get('status')?.toString().trim();

  if (!id || !name) {
    return new Response('Dados inválidos', { status: 400 });
  }

  const { error } = await supabase
    .from('projects')
    .update({ 
      name, 
      description, 
      status 
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    return new Response('Erro ao atualizar projeto', { status: 500 });
  }

  return Response.redirect(new URL('/admin', request.url), 303);
};