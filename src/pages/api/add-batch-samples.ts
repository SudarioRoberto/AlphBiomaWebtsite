import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    
    // Obter o ID do projeto dos cookies
    const projectId = cookies.get('client_project_id')?.value;
    
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Não autenticado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter arrays de dados do formulário
    const sampleIds = formData.getAll('sample_ids[]').map(id => id.toString());
    const animalIds = formData.getAll('animal_ids[]').map(id => id.toString());
    const treatments = formData.getAll('treatments[]').map(t => t.toString());
    const observations = formData.getAll('observations[]').map(o => o.toString());
    
    // Preparar dados para inserção
    const samples = [];
    for (let i = 0; i < sampleIds.length; i++) {
      if (sampleIds[i] && animalIds[i] && treatments[i]) {
        samples.push({
          sample_id: sampleIds[i],
          project_id: projectId,
          animal_id: animalIds[i],
          treatment: treatments[i],
          observation: observations[i] || null,
          status: 'Coletado',
          collection_date: new Date().toISOString()
        });
      }
    }
    
    if (samples.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Nenhuma amostra válida para adicionar.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Inserir amostras no banco de dados
    const { error } = await supabase
      .from('generic_samples')
      .insert(samples);
    
    if (error) {
      console.error('Erro ao inserir amostras:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao salvar amostras.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Atualizar a contagem de amostras no projeto
    const { data: projectData } = await supabase
      .from('projects')
      .select('sample_count')
      .eq('id', projectId)
      .single();
    
    const currentCount = projectData?.sample_count || 0;
    const newCount = currentCount + samples.length;
    
    await supabase
      .from('projects')
      .update({ sample_count: newCount })
      .eq('id', projectId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${samples.length} amostras adicionadas com sucesso.` 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar amostras:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};