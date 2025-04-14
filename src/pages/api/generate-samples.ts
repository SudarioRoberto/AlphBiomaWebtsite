// src/pages/api/generate-samples.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const prefix = form.get('prefix')?.toString() || '';
  const projectId = form.get('projectId')?.toString() || null;
  const countStr = form.get('count')?.toString() || '10';
  const startNumberStr = form.get('startNumber')?.toString() || '1';
  const digitsStr = form.get('digits')?.toString() || '3';
  
  const count = parseInt(countStr);
  const startNumber = parseInt(startNumberStr);
  const digits = parseInt(digitsStr);
  
  if (isNaN(count) || count <= 0 || count > 500) {
    return new Response('Quantidade inválida (máximo 500)', { status: 400 });
  }
  
  if (isNaN(startNumber) || startNumber < 0) {
    return new Response('Número inicial inválido', { status: 400 });
  }
  
  if (isNaN(digits) || digits <= 0 || digits > 10) {
    return new Response('Quantidade de dígitos inválida', { status: 400 });
  }
  
  try {
    // Gerar IDs das amostras
    const samples = [];
    for (let i = 0; i < count; i++) {
      const number = startNumber + i;
      const paddedNumber = number.toString().padStart(digits, '0');
      const sampleId = `${prefix}${paddedNumber}`;
      
      samples.push({
        sample_id: sampleId,
        project_id: projectId,
        status: projectId ? 'Em processamento' : 'Disponível',
        created_at: new Date().toISOString()
      });
    }
    
    // Inserir amostras no banco
    const { error } = await supabase
      .from('generic_samples')
      .insert(samples);
      
    if (error) {
      console.error('Erro ao gerar amostras:', error);
      return new Response(`Erro ao gerar amostras: ${error.message}`, { status: 500 });
    }
    
    // Atualizar contagem de amostras no projeto, se aplicável
    if (projectId) {
      await supabase.rpc('increment_sample_count', { 
        project_id_param: projectId, 
        increment_by: count 
      });
    }
    
    // Redirecionar para o admin
    return new Response(null, {
      status: 303,
      headers: { Location: projectId ? `/admin/samples/${projectId}` : '/admin' }
    });
  } catch (error) {
    console.error('Erro ao gerar amostras:', error);
    return new Response('Erro interno ao gerar amostras', { status: 500 });
  }
};