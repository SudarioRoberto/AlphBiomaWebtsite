import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sample_id, animal_id, treatment, observation } = await request.json();

    if (!sample_id) {
      return new Response(JSON.stringify({ success: false, message: 'sample_id ausente.' }), {
        status: 400
      });
    }

    const { error } = await supabase
      .from('generic_samples')
      .update({ animal_id, treatment, observation })
      .eq('sample_id', sample_id);

    if (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 500
      });
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Erro no servidor.' }), {
      status: 500
    });
  }
};
