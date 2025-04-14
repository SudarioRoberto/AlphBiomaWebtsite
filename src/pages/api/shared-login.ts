import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';
import bcrypt from 'bcryptjs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, password } = await request.json();

    if (!projectId || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID do projeto e senha são obrigatórios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar o projeto pelo ID
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, password, email, name, status, project_id')
      .eq('project_id', projectId)
      .single();

    if (error || !project) {
      return new Response(
        JSON.stringify({ success: false, message: 'Projeto não encontrado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a senha corresponde
    const passwordMatch = await bcrypt.compare(password, project.password);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, message: 'Senha incorreta.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Login bem-sucedido, retornar dados do projeto
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Login realizado com sucesso.',
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          projectId: project.project_id
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};