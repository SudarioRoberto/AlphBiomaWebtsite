import type { APIRoute } from 'astro';
import ExcelJS from 'exceljs';
import { supabase } from '../../lib/supabase.js';

export const GET: APIRoute = async ({ url }) => {
  const projectId = url.searchParams.get('project_id');

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'project_id ausente.' }), { status: 400 });
  }

  const { data: samples, error } = await supabase
    .from('generic_samples')
    .select('sample_id, animal_id, treatment, observation')
    .eq('project_id', projectId);

  if (error || !samples) {
    return new Response(JSON.stringify({ error: 'Erro ao buscar amostras.' }), { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Amostras');

  worksheet.columns = [
    { header: 'ID Amostra', key: 'sample_id', width: 20 },
    { header: 'ID Animal', key: 'animal_id', width: 20 },
    { header: 'Tratamento', key: 'treatment', width: 20 },
    { header: 'Observação', key: 'observation', width: 30 }
  ];

  samples.forEach(sample => {
    worksheet.addRow({
      sample_id: sample.sample_id,
      animal_id: sample.animal_id || '',
      treatment: sample.treatment || '',
      observation: sample.observation || ''
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="amostras.xlsx"'
    }
  });
};
