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

  if (!name || !email || isNaN(sampleCount) || sampleCount <= 0) {
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
  if (!password) {
    password = generateRandomPassword(8);
  }

  // Hash da senha
  const hash = hashPassword(password);

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

    // Importante: Armazenar o hash e o salt da senha
    const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{ 
      name, 
      description, 
      project_id: projectId,
      email,
      password_hash: hash, // só o hash
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
      status: 'Não coletado',
    }));

    const { error: sampleError } = await supabase.from('generic_samples').insert(samples);
    if (sampleError) {
      console.error(sampleError);
      return new Response('Erro ao salvar amostras', { status: 500 });
    }

    // Em produção, enviar email com as credenciais
    console.log(`Projeto criado com ID: ${projectId} e senha: ${password}`);

    // Adicionar a senha no retorno para exibição ao usuário
    return new Response(JSON.stringify({
      success: true,
      projectId,
      password,
      message: 'Projeto criado com sucesso'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Location': '/admin'
      }
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
};