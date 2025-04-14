// src/pages/api/reset-password.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';
import { hashPassword, generateRandomPassword } from '../../lib/auth.js';
import nodemailer from 'nodemailer';

export const prerender = false;

// Aqui você configuraria um transportador de email real
// Para teste, vamos apenas simular o envio de email
const sendEmail = async (to, subject, html) => {
  console.log(`Enviando email para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log(`Conteúdo: ${html}`);
  // Em produção, você usaria nodemailer ou outro serviço
  return true;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, email } = await request.json();

    if (!projectId || !email) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID do projeto e email são obrigatórios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o projeto existe e se o email corresponde
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, email')
      .eq('project_id', projectId)
      .single();

    if (error || !project) {
      return new Response(
        JSON.stringify({ success: false, message: 'Projeto não encontrado.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (project.email !== email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email não corresponde ao projeto.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gerar nova senha
    const newPassword = generateRandomPassword(10);
    const { hash, salt } = hashPassword(newPassword);

    // Atualizar a senha no banco de dados
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        password_hash: hash,
        password_salt: salt
      })
      .eq('id', project.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao atualizar a senha.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email com a nova senha
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Recuperação de Senha - AlphaBioma</h2>
        <p>Olá!</p>
        <p>Recebemos uma solicitação para redefinir a senha do seu projeto.</p>
        <p>Sua nova senha temporária é: <strong>${newPassword}</strong></p>
        <p>Recomendamos que você altere esta senha após o login.</p>
        <p>Se você não solicitou esta redefinição, por favor, entre em contato conosco imediatamente.</p>
        <p style="margin-top: 30px;">Atenciosamente,<br>Equipe AlphaBioma</p>
      </div>
    `;

    await sendEmail(
      email,
      "Recuperação de Senha - AlphaBioma",
      emailContent
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Email de recuperação enviado com sucesso.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};