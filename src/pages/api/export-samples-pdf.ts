import type { APIRoute } from 'astro';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 10;
  const margin = 40;
  const lineHeight = 16;
  let y = page.getHeight() - margin;

  const writeLine = (text: string) => {
    page.drawText(text, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
    y -= lineHeight;
  };

  writeLine('Relatório de Amostras');
  y -= lineHeight;

  writeLine('ID Amostra | ID Animal | Tratamento | Observação');
  writeLine('-------------------------------------------------------------');

  samples.forEach(s => {
    writeLine(`${s.sample_id} | ${s.animal_id || '-'} | ${s.treatment || '-'} | ${s.observation || '-'}`);
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="amostras.pdf"'
    }
  });
};
