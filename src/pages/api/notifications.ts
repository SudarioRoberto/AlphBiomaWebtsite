// src/pages/api/notifications.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

// Este endpoint gerencia notificações em tempo real entre o painel admin e o app mobile
// Permite que mudanças em status de projeto e amostras sejam notificadas instantaneamente

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { type, projectId, message, recipients, token } = await request.json();
    
    // Verificar token de autenticação
    if (!token || token !== process.env.NOTIFICATION_API_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, message: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar dados da notificação
    if (!type || !projectId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Dados incompletos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar projeto para obter detalhes
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, project_id, email')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Projeto não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Montar a notificação
    const notification = {
      project_id: projectId,
      type,
      message: message || getDefaultMessage(type, project),
      created_at: new Date().toISOString(),
      read: false
    };
    
    // Salvar a notificação no banco de dados
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select();
      
    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao salvar notificação', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Em um ambiente de produção, você enviaria notificações push e/ou emails aqui
    const notificationSent = await sendNotifications(type, project, recipients, message);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        notification: data[0],
        deliveryStatus: notificationSent
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Consulta as notificações de um projeto
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Obter parâmetros
    const projectId = url.searchParams.get('projectId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID do projeto é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar notificações
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao buscar notificações', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications: data,
        count,
        limit,
        offset
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Marca notificações como lidas
export const PUT: APIRoute = async ({ request }) => {
  try {
    const { notificationIds, projectId, all } = await request.json();
    
    if (!notificationIds && !all) {
      return new Response(
        JSON.stringify({ success: false, message: 'IDs de notificação ou sinalizador "all" é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let result;
    
    if (all && projectId) {
      // Marcar todas as notificações do projeto como lidas
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('project_id', projectId)
        .select();
        
      if (error) {
        throw new Error(`Erro ao atualizar notificações: ${error.message}`);
      }
      
      result = { updated: data.length };
    } else if (notificationIds && notificationIds.length > 0) {
      // Marcar notificações específicas como lidas
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .select();
        
      if (error) {
        throw new Error(`Erro ao atualizar notificações: ${error.message}`);
      }
      
      result = { updated: data.length };
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Dados inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Retorna mensagem padrão para o tipo de notificação
function getDefaultMessage(type, project) {
  const projectName = project?.name || 'seu projeto';
  const projectId = project?.project_id || '';
  
  switch (type) {
    case 'status_update':
      return `O status de ${projectName} (${projectId}) foi atualizado.`;
    case 'sample_added':
      return `Novas amostras foram adicionadas a ${projectName}.`;
    case 'password_reset':
      return `A senha de acesso para ${projectName} foi redefinida.`;
    case 'report_ready':
      return `O relatório de ${projectName} está disponível para visualização.`;
    case 'sample_processed':
      return `Amostras de ${projectName} foram processadas.`;
    default:
      return `Atualização em ${projectName}.`;
  }
}

// Envia notificações push/email (simulada para este exemplo)
async function sendNotifications(type, project, recipients, message) {
  console.log(`[SIMULAÇÃO] Enviando notificação de tipo "${type}" para ${project.name}`);
  
  // Em produção, você integraria serviços reais de notificação push e email
  const results = {
    push: { sent: true, recipients: 1 },
    email: { sent: true, recipients: 1 }
  };
  
  // Simulação de atraso de rede
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return results;
}