import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  // Delete cookies one by one
  cookies.delete('client_auth', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  
  cookies.delete('client_project_id', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });

  // Return new response with redirect
  return new Response(null, {
    status: 303, // Using 303 for POST-to-GET redirects
    headers: {
      'Location': '/' // Redirect to the homepage
    }
  });
};