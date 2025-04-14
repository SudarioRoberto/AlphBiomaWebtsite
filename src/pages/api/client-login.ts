// src/pages/api/client-login.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';
import bcrypt from 'bcryptjs';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { projectId, password } = await request.json();

    if (!projectId || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID do projeto e senha são obrigatórios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar o projeto
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, password_hash')
      .eq('project_id', projectId)
      .single();

    if (error || !project || !project.password_hash) {
      console.error('Hash ausente no projeto:', projectId);
      return new Response(
        JSON.stringify({ success: false, message: 'Projeto não encontrado ou senha não configurada.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar senha usando bcrypt localmente
    const isValid = bcrypt.compareSync(password, project.password_hash);

    if (!isValid) {
      console.warn('Senha incorreta para o projeto:', projectId);
      return new Response(
        JSON.stringify({ success: false, message: 'Senha incorreta.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Login autorizado, definir cookies
    cookies.set('client_auth', 'true', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    cookies.set('client_project_id', project.id, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login realizado com sucesso.',
        projectId: project.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
