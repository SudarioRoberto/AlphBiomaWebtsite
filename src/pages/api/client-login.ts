// src/pages/api/client-login.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

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

    // Buscar o projeto pelo ID (somente o ID interno, que será usado nos cookies)
    const { data: project, error } = await supabase
      .from('projects')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (error || !project) {
      return new Response(
        JSON.stringify({ success: false, message: 'Projeto não encontrado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar senha com a stored procedure
    const { data: isValid, error: passwordError } = await supabase.rpc('verify_project_password', {
      p_project_id: projectId,
      p_password: password
    });

    if (passwordError || !isValid) {
      return new Response(
        JSON.stringify({ success: false, message: 'Senha incorreta.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Em src/pages/api/client-login.ts
    const isProduction = import.meta.env.PROD;

    cookies.set('client_auth', 'true', {
      path: '/',
      httpOnly: true,
      secure: isProduction, // Só exige HTTPS em produção
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    cookies.set('client_project_id', project.id, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login realizado com sucesso.',
        projectId: project.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
