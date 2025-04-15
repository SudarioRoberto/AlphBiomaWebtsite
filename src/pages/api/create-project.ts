// src/pages/api/create-project.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';
import { hashPassword, generateRandomPassword } from '../../lib/auth.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const name = form.get('projectName')?.toString().trim();
  const description = form.get('description')?.toString().trim();
  const email = form.get('email')?.toString().trim();
  let password = form.get('password')?.toString().trim();
  const sampleCount = parseInt(form.get('sampleCount')?.toString() || '0');

  if (!name || !email ) {
    return new Response('Dados inválidos', { status: 400 });
  }

  // Gerar um ID de projeto no formato XX-123
  let namePrefix = name.replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 2);
  if (namePrefix.length < 2) {
    namePrefix = namePrefix.padEnd(2, 'A');
  }
  const randomNum = Math.floor(Math.random() * 900) + 100;
  const projectId = `${namePrefix}-${randomNum}`;

  // Gerar senha aleatória se não fornecida
  if (!password || password === '') {
    password = generateRandomPassword(8);
  }

  // Hash da senha (agora usando a função corrigida)
  const hashedPassword = hashPassword(password);

  try {
    // Verificar se o projeto já existe
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (existingProject) {
      return new Response('ID de projeto já existe. Tente novamente.', { status: 400 });
    }

    // Inserir o projeto com a senha hasheada
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{ 
        name, 
        description, 
        project_id: projectId,
        email,
        password_hash: hashedPassword, // Apenas o hash bcrypt (já inclui salt)
        status: 'Projeto gerado'
      }])
      .select()
      .single();

    if (projectError) {
      console.error(projectError);
      return new Response('Erro ao criar projeto', { status: 500 });
    }

    // Criar amostras para o projeto
    const samples = Array.from({ length: sampleCount }, (_, i) => ({
      sample_id: `${projectId}-${String(i + 1).padStart(3, '0')}`,
      project_id: project.id,
      status: 'Disponível',
    }));

    const { error: sampleError } = await supabase.from('generic_samples').insert(samples);
    if (sampleError) {
      console.error(sampleError);
      return new Response('Erro ao salvar amostras', { status: 500 });
    }

    // Atualizar a contagem de amostras no projeto
    await supabase
      .from('projects')
      .update({ sample_count: sampleCount })
      .eq('id', project.id);

    // Redirecionar para página de sucesso com as informações
    const redirectURL = `/admin/create?success=true&projectId=${encodeURIComponent(projectId)}&password=${encodeURIComponent(password)}`;
    
    return new Response(null, {
      status: 303,
      headers: { 
        'Location': redirectURL
      }
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
};