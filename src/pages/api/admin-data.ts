import { supabase } from '../../lib/supabase'; // ajuste o caminho se necessário

export async function GET() {
  const { data: projects, error: projErr } = await supabase.from('projects').select('*');
  const { data: samples, error: sampErr } = await supabase.from('generic_samples').select('*');

  if (projErr || sampErr) {
    return new Response(JSON.stringify({ error: 'Erro ao carregar dados' }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ projects, samples }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
