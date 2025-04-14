// src/pages/api/sync-sample-counts.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Verificar se há um parâmetro de redirecionamento
    const redirectUrl = new URL(request.url).searchParams.get('redirect');
    
    // Buscar todos os projetos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id');
      
    if (projectsError) {
      return new Response(JSON.stringify({ error: 'Erro ao buscar projetos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const results = [];
    
    // Para cada projeto, atualizar a contagem de amostras
    for (const project of projects) {
      // Contar amostras no generic_samples
      const { count, error: countError } = await supabase
        .from('generic_samples')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);
        
      if (countError) {
        results.push({
          projectId: project.id,
          error: 'Erro ao contar amostras'
        });
        continue;
      }
      
      // Atualizar a contagem no projeto
      const { error: updateError } = await supabase
        .from('projects')
        .update({ sample_count: count || 0 })
        .eq('id', project.id);
        
      results.push({
        projectId: project.id,
        oldCount: null, 
        newCount: count || 0,
        success: !updateError
      });
    }
    
    // Se houver um redirecionamento, faça-o
    if (redirectUrl) {
      return new Response(null, {
        status: 303,
        headers: { Location: redirectUrl }
      });
    }
    
    // Caso contrário, retorne os resultados como JSON
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};