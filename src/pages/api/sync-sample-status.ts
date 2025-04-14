// src/pages/api/sync-sample-status.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

// This endpoint will be called when project status changes to sync all samples
export const POST: APIRoute = async ({ request }) => {
  console.log('Sync sample statuses request received');
  
  const form = await request.formData();
  const projectId = form.get('id')?.toString();
  const newProjectStatus = form.get('status')?.toString();
  
  // Collection phases where samples can have individual statuses
  const collectionStatuses = ["Material entregue", "Amostras coletadas"];
  const isInCollectionPhase = collectionStatuses.includes(newProjectStatus);
  
  console.log('Syncing samples for project:', { projectId, newProjectStatus, isInCollectionPhase });

  if (!projectId || !newProjectStatus) {
    console.error('ID do projeto ou status ausente');
    return new Response('ID do projeto ou status ausente', { status: 400 });
  }

  try {
    // If we're not in collection phase, sync all sample statuses with project
    if (!isInCollectionPhase) {
      // Map project status to corresponding sample status
      let sampleStatus = 'Pendente';
      
      if (newProjectStatus === 'Amostras enviadas') {
        sampleStatus = 'Enviada';
      } else if (newProjectStatus === 'DNA extraído') {
        sampleStatus = 'Em processamento';
      } else if (newProjectStatus === 'DNA amplificado' || newProjectStatus === 'DNA sequenciado') {
        sampleStatus = 'Processada';
      } else if (newProjectStatus === 'Analisando dados' || newProjectStatus === 'Gerando relatório' || newProjectStatus === 'Relatório entregue') {
        sampleStatus = 'Analisada';
      }
      
      // Update all samples for this project
      const { data, error } = await supabase
        .from('samples')
        .update({ status: sampleStatus })
        .eq('project_id', projectId)
        .select();
      
      if (error) {
        console.error('Erro ao sincronizar status das amostras:', error);
        return new Response(`Erro ao sincronizar amostras: ${error.message}`, { status: 500 });
      }
      
      console.log(`Synced ${data.length} samples to status "${sampleStatus}"`);
    } else {
      // We're entering collection phase
      // If coming from earlier phase, set all samples to "Pendente"
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();
      
      if (!projectError && project) {
        const previousStatuses = ["Projeto gerado", "Material enviado"];
        if (previousStatuses.includes(project.status) && newProjectStatus === "Material entregue") {
          // Reset all samples to Pendente for collection
          const { data, error } = await supabase
            .from('samples')
            .update({ status: 'Pendente' })
            .eq('project_id', projectId)
            .select();
            
          if (error) {
            console.error('Erro ao resetar status das amostras:', error);
          } else {
            console.log(`Reset ${data.length} samples to "Pendente" for collection phase`);
          }
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error('Exception during sample sync:', e);
    return new Response(`Erro inesperado: ${e}`, { status: 500 });
  }
};