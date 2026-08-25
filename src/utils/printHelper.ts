/**
 * Isolated Direct Print Utility for Baran POS
 * Solves modal clipping, blank pages, and CSS transform interference
 */
export const printElement = (
  elementId: string,
  options?: {
    title?: string;
    pageSize?: 'A4' | 'thermal';
    orientation?: 'portrait' | 'landscape';
  }
) => {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }

  const {
    title = 'پەراوگەی باران - چاپکردن',
    pageSize = 'A4',
    orientation = 'portrait',
  } = options || {};

  // Create an invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.id = 'direct_print_frame_' + Date.now();

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Collect existing stylesheets and font links
  const headElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  const isThermal = pageSize === 'thermal';

  const pageCss = isThermal
    ? `
      @page {
        size: 80mm auto;
        margin: 2mm;
      }
      body {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 4mm !important;
        font-family: 'Noto Kufi Arabic', monospace, system-ui, sans-serif !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
    `
    : `
      @page {
        size: A4 ${orientation};
        margin: 8mm 10mm;
      }
      body {
        width: 100% !important;
        margin: 0 !important;
        padding: 6mm !important;
        font-family: 'Noto Kufi Arabic', system-ui, -apple-system, sans-serif !important;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th, td {
        border: 1px solid #cbd5e1 !important;
      }
    `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ku" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet">
        ${headElements}
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          ${pageCss}
          .print-hidden, .print\\:hidden, button {
            display: none !important;
          }
        </style>
      </head>
      <body class="bg-white text-slate-900" dir="rtl">
        ${el.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch {}
    }, 2000);
  }, 300);
};
