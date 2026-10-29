/** The blob belongs to this viewer document, so its lifetime is independent of the app tab. */
export function temporaryPdfViewer(
  contents: Buffer,
  nonce: string,
  title = 'Documento PDF'
): string {
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <style nonce="${nonce}">
    html, body { width: 100%; height: 100%; margin: 0; }
    body { background: #525659; }
    iframe { display: block; width: 100%; height: 100%; border: 0; }
    p { padding: 24px; color: #fff; font: 16px sans-serif; }
  </style>
</head>
<body>
  <p id="expired" hidden>Este documento temporal se cerró. Genérelo nuevamente para visualizarlo.</p>
  <noscript><p>Habilite JavaScript para visualizar el documento temporal.</p></noscript>
  <iframe id="pdf" title="${escapedTitle}"></iframe>
  <script nonce="${nonce}">
    (() => {
      const viewer = document.getElementById('pdf');
      const url = (() => {
        const bytes = Uint8Array.from(atob('${contents.toString('base64')}'), char => char.charCodeAt(0));
        return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      })();
      viewer.src = url;
      window.addEventListener('pagehide', () => {
        viewer.remove();
        URL.revokeObjectURL(url);
        document.getElementById('expired').hidden = false;
      }, { once: true });
      document.currentScript.remove();
    })();
  </script>
</body>
</html>`;
}
