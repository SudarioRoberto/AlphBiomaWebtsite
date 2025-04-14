import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export const prerender = false;

// Configurar o transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail', // Você pode mudar para outro serviço
  auth: {
    user: 'seu-email@gmail.com',
    pass: 'sua-senha-ou-app-password'
  }
});

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
      .select('id, email, name')
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
        JSON.stringify({ success: false, message: 'Email não corresponde ao cadastrado para este projeto.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gerar senha temporária
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Atualizar a senha no banco de dados
    const { error: updateError } = await supabase
      .from('projects')
      .update({ password: hashedPassword })
      .eq('id', project.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao redefinir a senha.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email com a nova senha
    await transporter.sendMail({
      from: 'seu-email@gmail.com',
      to: email,
      subject: 'Recuperação de Senha - AlphaBioma',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #1d4ed8;">Recuperação de Senha - AlphaBioma</h2>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha do projeto <strong>${project.name}</strong> (ID: ${projectId}).</p>
          <p>Sua nova senha temporária é: <strong>${tempPassword}</strong></p>
          <p>Recomendamos que você altere esta senha assim que fizer login.</p>
          <p>Se você não solicitou esta redefinição, por favor, entre em contato conosco imediatamente.</p>
          <p style="margin-top: 30px;">Atenciosamente,<br>Equipe AlphaBioma</p>
        </div>
      `
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Uma nova senha foi enviada para o seu email.' 
      }),
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