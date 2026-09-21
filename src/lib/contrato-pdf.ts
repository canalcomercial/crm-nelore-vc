import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Marcador de quebra de página usado nos templates:
 *   <div class="quebra-pagina" style="border-top:1px dashed #bbb;margin:24px 0"></div>
 * No PDF, cada bloco separado por esse marcador começa em uma nova página.
 */
const QUEBRA_PAGINA_RE = /<div[^>]*class="[^"]*quebra-pagina[^"]*"[^>]*>\s*<\/div>/gi;

async function renderBloco(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // ~A4 @ 96dpi
  container.style.padding = '40px 44px';
  container.style.boxSizing = 'border-box';
  container.style.background = '#ffffff';
  container.style.color = '#111';
  container.style.fontFamily = 'Georgia, "Times New Roman", serif';
  container.style.fontSize = '13px';
  container.style.lineHeight = '1.5';
  container.innerHTML = html;
  document.body.appendChild(container);

  // O reset do Tailwind (img { display:block }) faz o html2canvas medir errado a linha de base
  // do texto, deslocando-o para baixo nas células. Neutraliza só durante a renderização.
  const fix = document.createElement('style');
  fix.textContent = 'img{display:inline-block!important}';
  document.head.appendChild(fix);
  try {
    return await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
  } finally {
    fix.remove();
    document.body.removeChild(container);
  }
}

/**
 * Procura, subindo a partir de `alvo`, uma linha horizontal "em branco" no canvas
 * para cortar a página sem partir linhas de texto ao meio.
 */
function acharCorteLimpo(ctx: CanvasRenderingContext2D, largura: number, inicio: number, alvo: number): number {
  const limite = Math.max(inicio + 1, Math.floor(alvo - (alvo - inicio) * 0.2));
  const passoX = 4;
  for (let y = Math.floor(alvo); y > limite; y--) {
    const linha = ctx.getImageData(0, y, largura, 1).data;
    let branca = true;
    for (let x = 0; x < largura * 4; x += 4 * passoX) {
      if (linha[x] < 235 || linha[x + 1] < 235 || linha[x + 2] < 235) { branca = false; break; }
    }
    if (branca) return y;
  }
  return Math.floor(alvo);
}

/** Renderiza o HTML off-screen e converte em PDF A4 multipáginas (respeitando quebras de página). */
export async function htmlParaPdfBlob(html: string, opcoes: { umaPagina?: boolean } = {}): Promise<Blob> {
  const blocos = html.split(QUEBRA_PAGINA_RE).map((b) => b.trim()).filter(Boolean);
  if (blocos.length === 0) blocos.push(html || '<p></p>');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margemVert = 8; // mm (topo/rodapé das páginas de continuação)
  let primeiraPagina = true;

  for (const bloco of blocos) {
    const canvas = await renderBloco(bloco);

    // Documento de 1 página (ex.: nota de transporte): reduz proporcionalmente para caber em uma folha A4
    if (opcoes.umaPagina) {
      if (!primeiraPagina) pdf.addPage();
      primeiraPagina = false;
      const ratio = canvas.height / canvas.width;
      let w = pageW;
      let h = w * ratio;
      if (h > pageH) { h = pageH; w = h / ratio; }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pageW - w) / 2, 0, w, h);
      continue;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const pxPorMm = canvas.width / pageW;
    const alturaPaginaPx = Math.floor((pageH - margemVert * 2) * pxPorMm);
    const alturaPrimeiraPx = Math.floor((pageH - margemVert) * pxPorMm);

    let y = 0;
    let pagDoBloco = 0;
    while (y < canvas.height - 2) {
      const util = pagDoBloco === 0 ? alturaPrimeiraPx : alturaPaginaPx;
      let fim = Math.min(canvas.height, y + util);
      if (fim < canvas.height && ctx) fim = acharCorteLimpo(ctx, canvas.width, y, fim);
      const alturaFatia = fim - y;

      // Ignora sobras totalmente brancas no fim do bloco
      if (ctx && fim >= canvas.height && pagDoBloco > 0) {
        const dados = ctx.getImageData(0, y, canvas.width, alturaFatia).data;
        let temConteudo = false;
        for (let i = 0; i < dados.length; i += 16) { if (dados[i] < 235) { temConteudo = true; break; } }
        if (!temConteudo) break;
      }

      const fatia = document.createElement('canvas');
      fatia.width = canvas.width;
      fatia.height = alturaFatia;
      fatia.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, alturaFatia, 0, 0, canvas.width, alturaFatia);

      if (!primeiraPagina) pdf.addPage();
      primeiraPagina = false;
      const topo = pagDoBloco === 0 ? 0 : margemVert;
      pdf.addImage(fatia.toDataURL('image/jpeg', 0.92), 'JPEG', 0, topo, pageW, alturaFatia / pxPorMm);

      y = fim;
      pagDoBloco++;
    }
  }

  return pdf.output('blob');
}

export async function sha256(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Dispara o download de um Blob no navegador. */
export function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Gera um nome de arquivo seguro (sem acentos/espaços). */
export function nomeArquivoSeguro(s: string) {
  return (s || 'arquivo')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60) || 'arquivo';
}
