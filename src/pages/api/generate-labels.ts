import { APIRoute } from 'astro';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import bwipjs from 'bwip-js';
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const { data: samples, error } = await supabase
      .from('generic_samples')
      .select('sample_id')
      .eq('status', 'Disponível');

    if (error || !samples) {
      return new Response(JSON.stringify({ error: 'Erro ao buscar amostras' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pageSize = [595.28, 841.89]; // A4
    let page = pdfDoc.addPage(pageSize);

    // Tamanhos convertidos de cm para pontos
    const labelWidth = 56.7;      // 2 cm
    const labelHeight = 28.35;    // 1 cm
    const dmSize = 25;         // 1 cm x 1 cm
    const margin = 2.83;          // 1 mm entre etiquetas
    const marginTopBottom = 90;   // margem superior e inferior

    // Cálculo horizontal
    const labelsPerRow = Math.floor((pageSize[0] + margin) / (labelWidth + margin));
    const totalLabelWidth = labelsPerRow * labelWidth + (labelsPerRow - 1) * margin;
    const startX = (pageSize[0] - totalLabelWidth) / 2;

    let x = startX;
    let y = pageSize[1] - marginTopBottom;

    for (let i = 0; i < samples.length; i++) {
      const id = samples[i].sample_id;

      // Geração do código DataMatrix
      const dmBuffer = await bwipjs.toBuffer({
        bcid: 'datamatrix',
        text: id,
        scale: 3,
        includetext: false,
        padding: 0,
        width: dmSize,
        height: dmSize
      });

      const dmImage = await pdfDoc.embedPng(dmBuffer);
      const dmDims = dmImage.scaleToFit(dmSize, dmSize);

      // Desenha a borda da etiqueta
      page.drawRectangle({
        x,
        y,
        width: labelWidth,
        height: labelHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.3,
      });

      // Desenha o DataMatrix
      page.drawImage(dmImage, {
        x: x + 2,
        y: y + (labelHeight - dmDims.height) / 2,
        width: dmDims.width,
        height: dmDims.height,
      });

      // Desenha o texto da amostra
      page.drawText(id, {
        x: x + dmSize + 4,
        y: y + labelHeight - 7, // aproximadamente 7 pt abaixo do topo
        size: 5,
        font,
        color: rgb(0, 0, 0),
      });

      // Avança para a próxima posição horizontal
      x += labelWidth + margin;

      // Verifica se deve quebrar linha
      if ((x + labelWidth) > pageSize[0] - startX) {
        x = startX;
        y -= labelHeight + margin;
      }

      // Nova página se acabar o espaço vertical
      if (y < marginTopBottom) {
        page = pdfDoc.addPage(pageSize);
        x = startX;
        y = pageSize[1] - marginTopBottom;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=etiquetas-2x1cm.pdf',
      },
    });
  } catch (err) {
    console.error('Erro na geração do PDF:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
