import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  // Delete the cookie
  cookies.delete('admin_auth', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax', // Changed from 'strict' to 'lax'
    secure: true,
  });

  // Create a new response for the redirect
  return new Response(null, {
    status: 303, // Using 303 for POST-to-GET redirects
    headers: {
      'Location': '/' // Redirect to the homepage
    }
  });
};