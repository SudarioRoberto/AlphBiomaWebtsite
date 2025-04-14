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

  // Gerar Project ID no formato: XX-123 (duas letras - três números)
  // Extrair as duas primeiras letras do nome do projeto (ou usar AB como padrão)
  let namePrefix = name.replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 2);
  if (namePrefix.length < 2) {
    namePrefix = namePrefix.padEnd(2, 'A'); // Completa com 'A' se necessário
  }
  
  // Gerar um número aleatório de 3 dígitos
  const randomNum = Math.floor(Math.random() * 900) + 100; // Entre 100 e 999
  
  const projectId = `${namePrefix}-${randomNum}`;

  // Gerar senha aleatória se não fornecida
  if (!password) {
    password = generateRandomPassword(8);
  }

  // Hash da senha
  const { hash, salt } = hashPassword(password);

  try {
    // Verificar se o projeto com este ID já existe
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (existingProject) {
      // Se já existe, gerar outro ID
      return new Response('ID de projeto já existe. Tente novamente.', { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{ 
        name, 
        description, 
        project_id: projectId,
        email,
        password_hash: hash,
        password_salt: salt,
        status: 'Projeto gerado'
      }])
      .select()
      .single();

    if (projectError) {
      console.error(projectError);
      return new Response('Erro ao criar projeto', { status: 500 });
    }

    const samples = Array.from({ length: sampleCount }, (_, i) => ({
      sample_id: `${projectId}-${String(i + 1).padStart(3, '0')}`,
      project_id: project.id,
      status: 'Não coletado',
    }));

    const { error: sampleError } = await supabase.from('samples').insert(samples);
    if (sampleError) {
      console.error(sampleError);
      return new Response('Erro ao salvar amostras', { status: 500 });
    }

    // Em produção, você enviaria um email com as credenciais aqui
    console.log(`Projeto criado com ID: ${projectId} e senha: ${password}`);

    return new Response(null, {
      status: 303,
      headers: { Location: '/admin' }
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
};