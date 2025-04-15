import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export async function POST({ request }) {
  const formData = await request.formData();
  const id = formData.get('id');
  
  if (!id) {
    return new Response('ID é obrigatório', { status: 400 });
  }
  
  try {
    // Verificar se a amostra está associada a algum projeto
    const { data: sample } = await supabase
      .from('generic_samples')
      .select('project_id, sample_id')
      .eq('id', id)
      .single();
      
    if (!sample) {
      // Tentar buscar pelo sample_id caso o id não seja o correto
      const { data: sampleById } = await supabase
        .from('generic_samples')
        .select('project_id, id, sample_id')
        .eq('sample_id', id)
        .single();
        
      if (sampleById?.project_id) {
        return new Response('Não é possível excluir uma amostra associada a um projeto', { status: 403 });
      }
      
      // Se encontrou pelo sample_id, usa este id para excluir
      if (sampleById) {
        const { error } = await supabase
          .from('generic_samples')
          .delete()
          .eq('id', sampleById.id);
          
        if (error) throw error;
      }
    } else if (sample.project_id) {
      return new Response('Não é possível excluir uma amostra associada a um projeto', { status: 403 });
    } else {
      // Excluir a amostra usando o id original
      const { error } = await supabase
        .from('generic_samples')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    }
    
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/generic-samples' }
    });
  } catch (error) {
    console.error('Erro ao excluir amostra:', error);
    return new Response('Erro ao excluir amostra: ' + error.message, { status: 500 });
  }
}