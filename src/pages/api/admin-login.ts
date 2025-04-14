// src/pages/api/admin-login.ts
import type { APIRoute } from 'astro';

export const prerender = false;

// Hardcoded admin credentials for immediate fix
const ADMIN_EMAIL = 'sudario@alphabioma.com';
const ADMIN_PASSWORD = '3588Ufla+';

// Simple function to verify admin password
function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check request content type
    const contentType = request.headers.get('content-type') || '';
    
    let email, password;
    
    if (contentType.includes('application/json')) {
      // Parse JSON data
      const data = await request.json();
      email = data.email;
      password = data.password;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Parse form data
      const formData = await request.formData();
      email = formData.get('email')?.toString();
      password = formData.get('password')?.toString();
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Content type not supported.'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify admin credentials
    if (email === ADMIN_EMAIL && verifyAdminPassword(password)) {
      // Set the auth cookie
      cookies.set('admin_auth', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax', // Changed from 'strict' to 'lax'
        maxAge: 60 * 60 * 2, // 2 hours
      });
      
      // Create a new response for the redirect
      return new Response(null, {
        status: 303, // Using 303 instead of 302 for POST-to-GET redirects
        headers: {
          'Location': '/admin'
        }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Credenciais de administrador inválidas.'
    }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return new Response(JSON.stringify({
      success: false, 
      message: 'Erro ao processar o login.'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};