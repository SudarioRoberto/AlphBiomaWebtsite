import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const id = form.get('id')?.toString();

    if (!id) return new Response('Project ID ausente', { status: 400 });

    console.log(`Tentando excluir projeto com ID: ${id}`);

    // Primeiro, verificamos se o projeto existe
    const { data: project, error: projectCheckError } = await supabase
      .from('projects')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (projectCheckError) {
      console.error('Erro ao verificar projeto:', projectCheckError);
      return new Response(`Erro ao verificar projeto: ${projectCheckError.message}`, { status: 500 });
    }

    if (!project) {
      return new Response('Projeto não encontrado', { status: 404 });
    }

    // Excluir amostras relacionadas ao projeto
    const { error: deleteSamplesError } = await supabase
      .from('generic_samples')
      .update({
        project_id: null,
        animal_id: null,
        treatment: null,
        observation: null,
        status: 'Disponível',
        collection_date: null
      })
      .eq('project_id', id);

    if (deleteSamplesError) {
      console.error('Erro ao desassociar amostras do projeto:', deleteSamplesError);
      return new Response(`Erro ao desassociar amostras: ${deleteSamplesError.message}`, { status: 500 });
    }

    // Excluir o projeto
    const { error: deleteProjectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteProjectError) {
      console.error('Erro ao excluir projeto:', deleteProjectError);
      return new Response(`Erro ao excluir projeto: ${deleteProjectError.message}`, { status: 500 });
    }

    console.log(`Projeto ${id} excluído com sucesso`);
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin' }
    });
  } catch (error) {
    console.error('Erro ao processar exclusão do projeto:', error);
    return new Response(`Erro interno do servidor: ${error.message}`, { status: 500 });
  }
};