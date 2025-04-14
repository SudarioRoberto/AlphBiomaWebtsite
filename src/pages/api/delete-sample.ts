// src/pages/api/delete-sample.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const id = form.get('id')?.toString();
  const returnPath = form.get('returnPath')?.toString() || '/admin';

  if (!id) return new Response('Sample ID ausente', { status: 400 });

  // Obter informações da amostra antes de deletar
  const { data: sample, error: fetchError } = await supabase
    .from('generic_samples')
    .select('project_id')
    .eq('sample_id', id)
    .single();

  if (fetchError) {
    console.error('Erro ao buscar amostra:', fetchError);
    return new Response('Erro ao buscar amostra', { status: 500 });
  }

  const projectId = sample?.project_id;

  // Opção 1: Se quiser realmente excluir a amostra
  // const { error } = await supabase.from('generic_samples').delete().eq('sample_id', id);

  // Opção 2: Se quiser apenas desassociar do projeto (recomendado)
  const { error } = await supabase
    .from('generic_samples')
    .update({
      project_id: null,
      animal_id: null,
      treatment: null,
      observation: null,
      status: 'Disponível',
      collection_date: null
    })
    .eq('sample_id', id);

  if (error) {
    console.error('Erro ao processar amostra:', error);
    return new Response('Erro ao processar amostra', { status: 500 });
  }

  // Atualizar a contagem de amostras no projeto se houver um projeto
  if (projectId) {
    await supabase.rpc('increment_sample_count', {
      project_id_param: projectId,
      increment_by: -1
    });
  }

  return new Response(null, {
    status: 303,
    headers: { Location: returnPath },
  });
};