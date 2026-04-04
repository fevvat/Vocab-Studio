import { createWorker } from 'tesseract.js';

interface PdfProgress {
  stage: string;
  progress: number;
}

export async function extractTextFromPdf(file: File, onProgress?: (info: PdfProgress) => void) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    onProgress?.({ stage: `PDF metni okunuyor (${pageNum}/${pdf.numPages})`, progress: Math.round((pageNum / pdf.numPages) * 45) });
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  const combined = pageTexts.join('\n');
  if (combined.trim().length > 40) {
    return combined;
  }

  const worker = await createWorker('eng', 1, {
    logger: (message: any) => {
      if (message.status === 'recognizing text') {
        onProgress?.({ stage: 'PDF sayfalarında OCR çalışıyor', progress: 45 + Math.round((message.progress || 0) * 55) });
      }
    },
  });

  const ocrTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, canvas, viewport }).promise;

    const result = await worker.recognize(canvas);
    ocrTexts.push(result.data.text);
  }

  await worker.terminate();
  return ocrTexts.join('\n');
}
