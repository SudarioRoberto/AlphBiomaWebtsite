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

    const labelWidth = 113; // 4 cm
    const labelHeight = 14; // 0.5 cm
    const margin = 2.83; // 1 mm entre etiquetas
    const qrSize = 12; // Tamanho do QR code em pontos

    let x = 40;
    let y = pageSize[1] - 40;

    for (let i = 0; i < samples.length; i++) {
      const id = samples[i].sample_id;

      const qrBuffer = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: id,
        scale: 2,
        padding: 0,
        width: qrSize,
        height: qrSize
      });

      const qrImage = await pdfDoc.embedPng(qrBuffer);
      const qrDims = qrImage.scaleToFit(qrSize, qrSize);

      // Redesenha o fundo da etiqueta
      page.drawRectangle({
        x,
        y,
        width: labelWidth,
        height: labelHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
      });

      // QR code centralizado na altura
      page.drawImage(qrImage, {
        x: x + 2,
        y: y + (labelHeight - qrDims.height) / 2,
        width: qrDims.width,
        height: qrDims.height,
      });

      // Texto da amostra
      page.drawText(id, {
        x: x + 20,
        y: y + (labelHeight / 2) - 4,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });

      // Avança para a próxima posição
      x += labelWidth + margin;
      if (x + labelWidth > pageSize[0] - 40) {
        x = 40;
        y -= labelHeight + margin;
      }

      // Se acabou o espaço na página, adiciona nova
      if (y < 40) {
        page = pdfDoc.addPage(pageSize);
        x = 40;
        y = pageSize[1] - 40;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=etiquetas.pdf',
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
