// src/pages/api/sync-admin-app.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';
import CryptoJS from 'crypto-js';

// Importar as funções do arquivo auth.js atualizado
import { hashPassword, generateRandomPassword } from '../../lib/auth.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, data, token } = await request.json();
    
    // Verificar token de autenticação
    // Em produção, implementar uma verificação de token mais robusta
    if (!token || token !== 'abc123') {
      return new Response(
        JSON.stringify({ success: false, message: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let result;
    
    // Definir ações disponíveis
    switch (action) {
      case 'sync_project_status':
        result = await syncProjectStatus(data.projectId, data.status);
        break;
        
      case 'sync_samples':
        result = await syncSamples(data.projectId);
        break;
        
      case 'add_samples':
        result = await addSamples(data.projectId, data.count);
        break;
        
      case 'update_sample':
        result = await updateSample(data.sampleId, data.sampleData);
        break;
        
      case 'remove_sample':
        result = await removeSample(data.sampleId);
        break;
        
      case 'reset_password':
        result = await resetPassword(data.projectId);
        break;
        
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Ação desconhecida' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Sincroniza o status de um projeto e suas amostras
async function syncProjectStatus(projectId, status) {
  // Primeiro, atualizar o status do projeto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .select()
    .single();
    
  if (projectError) {
    throw new Error(`Erro ao atualizar status do projeto: ${projectError.message}`);
  }
  
  // Determinar o status das amostras com base no status do projeto
  let sampleStatus = 'Pendente';
  
  if (status === 'Amostras enviadas') {
    sampleStatus = 'Enviada';
  } else if (status === 'DNA extraído') {
    sampleStatus = 'Em processamento';
  } else if (['DNA amplificado', 'DNA sequenciado'].includes(status)) {
    sampleStatus = 'Processada';
  } else if (['Analisando dados', 'Gerando relatório', 'Relatório entregue'].includes(status)) {
    sampleStatus = 'Analisada';
  }
  
  // Atualizar todas as amostras do projeto com o novo status
  const { data: samples, error: samplesError } = await supabase
    .from('generic_samples')
    .update({ status: sampleStatus })
    .eq('project_id', projectId)
    .select();
    
  if (samplesError) {
    throw new Error(`Erro ao atualizar status das amostras: ${samplesError.message}`);
  }
  
  return {
    project,
    samplesUpdated: samples ? samples.length : 0,
    newSampleStatus: sampleStatus
  };
}

// Sincroniza as amostras de um projeto entre admin e app
async function syncSamples(projectId) {
  // Buscar todas as amostras do projeto
  const { data: samples, error } = await supabase
    .from('generic_samples')
    .select('*')
    .eq('project_id', projectId);
    
  if (error) {
    throw new Error(`Erro ao buscar amostras: ${error.message}`);
  }
  
  // Contar amostras do projeto
  const { count, error: countError } = await supabase
    .from('generic_samples')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
    
  if (countError) {
    throw new Error(`Erro ao contar amostras: ${countError.message}`);
  }
  
  // Atualizar a contagem de amostras no projeto
  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update({ sample_count: count || 0 })
    .eq('id', projectId)
    .select()
    .single();
    
  if (updateError) {
    throw new Error(`Erro ao atualizar contagem de amostras: ${updateError.message}`);
  }
  
  return {
    samples,
    sampleCount: count || 0,
    project: updatedProject
  };
}

// Adiciona novas amostras a um projeto
async function addSamples(projectId, count) {
  // Obter o ID do projeto (formato AB-1234)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('project_id')
    .eq('id', projectId)
    .single();
    
  if (projectError) {
    throw new Error(`Erro ao buscar projeto: ${projectError.message}`);
  }
  
  // Obter a contagem atual de amostras para este projeto
  const { count: currentCount, error: countError } = await supabase
    .from('generic_samples')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
    
  if (countError) {
    throw new Error(`Erro ao contar amostras: ${countError.message}`);
  }
  
  // Gerar novas amostras com IDs sequenciais
  const samples = [];
  const startNumber = (currentCount || 0) + 1;
  
  for (let i = 0; i < count; i++) {
    const sampleNumber = (startNumber + i).toString().padStart(3, '0');
    samples.push({
      sample_id: `${project.project_id}-${sampleNumber}`,
      project_id: projectId,
      status: 'Disponível',
    });
  }
  
  // Inserir as amostras no banco de dados
  const { data, error } = await supabase
    .from('generic_samples')
    .insert(samples)
    .select();
    
  if (error) {
    throw new Error(`Erro ao inserir amostras: ${error.message}`);
  }
  
  // Atualizar a contagem de amostras no projeto
  await supabase.rpc('increment_sample_count', {
    project_id_param: projectId,
    increment_by: count
  });
  
  return {
    samples: data,
    count,
    startNumber
  };
}

// Atualiza os dados de uma amostra específica
async function updateSample(sampleId, sampleData) {
  const { data, error } = await supabase
    .from('generic_samples')
    .update({
      animal_id: sampleData.animal || sampleData.animal_id,
      treatment: sampleData.treatment,
      observation: sampleData.observation,
      status: sampleData.status,
      collection_date: sampleData.collection_date || new Date().toISOString()
    })
    .eq('sample_id', sampleId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Erro ao atualizar amostra: ${error.message}`);
  }
  
  return data;
}

// Remove uma amostra de um projeto (tornando-a disponível novamente)
async function removeSample(sampleId) {
  // Primeiro, obter o project_id atual para depois decrementar a contagem
  const { data: sample, error: fetchError } = await supabase
    .from('generic_samples')
    .select('project_id')
    .eq('sample_id', sampleId)
    .single();
    
  if (fetchError) {
    throw new Error(`Erro ao buscar amostra: ${fetchError.message}`);
  }
  
  const projectId = sample.project_id;
  
  // Desassociar a amostra do projeto
  const { data, error } = await supabase
    .from('generic_samples')
    .update({
      project_id: null,
      animal_id: null,
      treatment: null,
      observation: null,
      status: 'Disponível',
      collection_date: null
    })
    .eq('sample_id', sampleId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Erro ao remover amostra: ${error.message}`);
  }
  
  // Decrementar a contagem de amostras no projeto
  if (projectId) {
    await supabase.rpc('increment_sample_count', {
      project_id_param: projectId,
      increment_by: -1
    });
  }
  
  return {
    sample: data,
    removedFrom: projectId
  };
}

// Redefine a senha de um projeto/cliente
async function resetPassword(projectId) {
  // Gerar nova senha
  const newPassword = generateRandomPassword(10);
  
  // Hash da nova senha - usando a função importada do auth.js atualizado
  const { hash, salt } = hashPassword(newPassword);
  
  // Atualizar a senha no banco de dados
  const { data, error } = await supabase
    .from('projects')
    .update({
      password_hash: hash,
      password_salt: salt
    })
    .eq('id', projectId)
    .select('email, project_id, name')
    .single();
    
  if (error) {
    throw new Error(`Erro ao redefinir senha: ${error.message}`);
  }
  
  // Em produção, você enviaria um email com a nova senha aqui
  
  return {
    project: data,
    generatedPassword: newPassword, // Em produção, isso seria enviado apenas por email
  };
}