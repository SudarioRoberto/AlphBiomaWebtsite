// src/pages/api/update-sample.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const sampleId = form.get('sampleId')?.toString();
  const animalId = form.get('animalId')?.toString();
  const treatment = form.get('treatment')?.toString();
  const status = form.get('status')?.toString();
  const observation = form.get('observation')?.toString();

  if (!sampleId) {
    return new Response('ID da amostra ausente', { status: 400 });
  }

  // Buscar informações da amostra para obter o project_id
  const { data: sample, error: sampleError } = await supabase
    .from('generic_samples')
    .select('project_id')
    .eq('sample_id', sampleId)
    .single();

  if (sampleError) {
    console.error('Erro ao buscar amostra:', sampleError);
    return new Response('Erro ao buscar amostra', { status: 500 });
  }

  // Atualizar a amostra
  const { error: updateError } = await supabase
    .from('generic_samples')
    .update({
      animal_id: animalId,
      treatment: treatment,
      status: status,
      observation: observation
    })
    .eq('sample_id', sampleId);

  if (updateError) {
    console.error('Erro ao atualizar amostra:', updateError);
    return new Response('Erro ao atualizar amostra', { status: 500 });
  }

  // Redirecionar para a página de detalhes da amostra
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/sample/${sampleId}` }
  });
};