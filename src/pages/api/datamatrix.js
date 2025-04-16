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
    // Calculate scale based on requested size
    const scale = Math.max(2, Math.floor(size / 40));
    
    // Generate SVG using bwip-js
    const svgString = await bwipjs.toSVG({
      bcid: 'datamatrix',     // DataMatrix format
      text: text,             // Text to encode
      scale: scale,           // Calculated scale
      includetext: false,     // No readable text
      textxalign: 'center',   // Alignment (even if not used)
      paddingwidth: 1,        // Equivalent to margin
      paddingheight: 1
    });
    
    // Return the SVG
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