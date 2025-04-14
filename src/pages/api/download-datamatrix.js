// src/pages/api/download-datamatrix.js
import bwipjs from 'bwip-js';

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const text = url.searchParams.get('id') || '';
  
  if (!text) {
    return new Response('ID para codificar é obrigatório', { status: 400 });
  }
  
  try {
    // Gerar SVG usando bwip-js
    const svgString = await bwipjs.toSVG({
      bcid: 'datamatrix',       // Tipo de código: DataMatrix
      text: text,               // Texto a codificar
      scale: 3,                 // Escala um pouco maior para download
      includetext: false,       // Não incluir texto legível
      textxalign: 'center',     // Alinhamento do texto (mesmo que não usado)
      paddingwidth: 2,          // Equivalente à margem
      paddingheight: 2
    });
    
    // Adicionar alguns metadados para garantir que o SVG se comporte bem quando baixado
    const fileName = `datamatrix-${text.replace(/[^a-zA-Z0-9]/g, '-')}.svg`;
    
    // Retornar o SVG como um download
    return new Response(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      }
    });
  } catch (error) {
    console.error('Erro ao gerar Data Matrix:', error);
    return new Response('Erro ao gerar código Data Matrix', { status: 500 });
  }
}