// src/pages/api/datamatrix.js
import bwipjs from 'bwip-js';

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const text = url.searchParams.get('text') || '';
  const size = parseInt(url.searchParams.get('size') || '100');
  
  if (!text) {
    return new Response('Texto para codificar é obrigatório', { status: 400 });
  }
  
  try {
    // Calcular escala baseada no tamanho solicitado (bwip-js usa escala diferente)
    const scale = Math.max(1, Math.floor(size / 50));
    
    // Gerar SVG usando bwip-js
    const svgString = await bwipjs.toSVG({
      bcid: 'datamatrix',       // Tipo de código: DataMatrix
      text: text,               // Texto a codificar
      scale: scale,             // Escala calculada para corresponder ao tamanho desejado
      includetext: false,       // Não incluir texto legível
      textxalign: 'center',     // Alinhamento do texto (mesmo que não usado)
      paddingwidth: 2,          // Equivalente à margem
      paddingheight: 2
    });
    
    // Retornar o SVG
    return new Response(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'max-age=86400'
      }
    });
  } catch (error) {
    console.error('Erro ao gerar Data Matrix:', error);
    return new Response('Erro ao gerar código Data Matrix', { status: 500 });
  }
}