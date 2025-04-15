// src/pages/api/batch-delete-samples.js
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export async function POST({ request }) {
  const formData = await request.formData();
  const sampleIds = formData.getAll('sampleIds[]');
  
  if (!sampleIds || sampleIds.length === 0) {
    return new Response('Nenhuma amostra selecionada', { status: 400 });
  }
  
  try {
    console.log(`Tentando excluir ${sampleIds.length} amostras genéricas`);
    
    // Verificar se alguma amostra está associada a um projeto
    const { data: associatedSamples, error: checkError } = await supabase
      .from('generic_samples')
      .select('id, sample_id, project_id')
      .in('id', sampleIds)
      .not('project_id', 'is', null);
    
    if (checkError) {
      console.error('Erro ao verificar amostras associadas:', checkError);
      return new Response(`Erro ao verificar amostras: ${checkError.message}`, { status: 500 });
    }
    
    // Se encontrou amostras associadas a projetos, retornar erro
    if (associatedSamples && associatedSamples.length > 0) {
      const associatedIds = associatedSamples.map(s => s.sample_id).join(', ');
      return new Response(
        `Não é possível excluir amostras associadas a projetos. Amostras: ${associatedIds}`, 
        { status: 403 }
      );
    }
    
    // Excluir as amostras selecionadas
    const { data, error } = await supabase
      .from('generic_samples')
      .delete()
      .in('id', sampleIds)
      .is('project_id', null); // Garantir que só exclui amostras não associadas
    
    if (error) {
      console.error('Erro ao excluir amostras:', error);
      return new Response(`Erro ao excluir amostras: ${error.message}`, { status: 500 });
    }
    
    // Mensagem de sucesso
    const message = sampleIds.length === 1
      ? 'Amostra excluída com sucesso'
      : `${sampleIds.length} amostras excluídas com sucesso`;
    
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/generic-samples?success=${encodeURIComponent(message)}` }
    });
  } catch (error) {
    console.error('Erro ao processar exclusão de amostras:', error);
    return new Response(`Erro interno do servidor: ${error.message}`, { status: 500 });
  }
}