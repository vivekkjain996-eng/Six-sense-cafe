import QRCode from "qrcode";
import sharp from "sharp";

export function tableMenuUrl(qrToken: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/menu/${qrToken}`;
}

// Builds an SVG (QR + "Table N" label drawn as real text) and rasterizes it
// to PNG with sharp. PNG is used because apps like WhatsApp don't render
// SVG image previews — shared SVGs show up as a blank screen.
export async function generateTableQrPng(qrToken: string, tableNumber: number): Promise<Buffer> {
  const url = tableMenuUrl(qrToken);
  const size = 400;
  const labelHeight = 70;

  const qrSvg = await QRCode.toString(url, { type: "svg", width: size, margin: 2 });
  const qrSvgWithoutXmlDeclaration = qrSvg.replace(/<\?xml[^>]*\?>\s*/, "");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + labelHeight}" viewBox="0 0 ${size} ${size + labelHeight}">
  <rect width="${size}" height="${size + labelHeight}" fill="#ffffff"/>
  ${qrSvgWithoutXmlDeclaration}
  <text x="${size / 2}" y="${size + labelHeight / 2 + 10}" font-family="Arial, sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="#000000">Table ${tableNumber}</text>
</svg>`;

  // Render at 2x for crisp printing, then flatten onto white (WhatsApp/JPEG
  // previews handle opaque PNGs more reliably than ones with alpha).
  return sharp(Buffer.from(svg), { density: 288 })
    .resize(size * 2, (size + labelHeight) * 2)
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
}
