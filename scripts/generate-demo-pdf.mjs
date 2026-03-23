/**
 * Генерирует public/samples/demo.pdf: база W3C dummy.pdf + текст (pdf-parse совместим).
 * Запуск: node scripts/generate-demo-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "public", "samples", "demo.pdf");
const W3C_DUMMY =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

const text =
  "Sensify demo: this PDF adds selectable text for extraction (over thirty characters).";

const baseBytes = await fetchBuf(W3C_DUMMY);
const doc = await PDFDocument.load(baseBytes);
const font = await doc.embedFont(StandardFonts.Helvetica);
const [page] = doc.getPages();
const { width, height } = page.getSize();
page.drawText(text, {
  x: 40,
  y: Math.max(40, height - 80),
  size: 11,
  font,
  color: rgb(0.1, 0.1, 0.2),
  maxWidth: width - 80,
  lineHeight: 14,
});

const pdfBytes = await doc.save({ useObjectStreams: false });
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, pdfBytes);
console.log("Wrote", outPath);
