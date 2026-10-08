import * as pdfjs from 'pdfjs-dist/build/pdf';

// The worker is bundled as a separate asset (webpack 5 `new URL` pattern).
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

export default pdfjs;
