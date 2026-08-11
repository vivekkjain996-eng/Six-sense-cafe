import QRCode from "qrcode";

export function tableMenuUrl(qrToken: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/menu/${qrToken}`;
}

// Renders as SVG (not PNG) so the "Table N" label can be drawn as real text
// directly in the file — no native canvas/image library needed, which keeps
// this safe to run on Vercel's serverless functions.
export async function generateTableQrSvg(qrToken: string, tableNumber: number): Promise<string> {
  const url = tableMenuUrl(qrToken);
  const size = 400;
  const labelHeight = 70;

  const qrSvg = await QRCode.toString(url, { type: "svg", width: size, margin: 2 });
  const qrSvgWithoutXmlDeclaration = qrSvg.replace(/<\?xml[^>]*\?>\s*/, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + labelHeight}" viewBox="0 0 ${size} ${size + labelHeight}">
  <rect width="${size}" height="${size + labelHeight}" fill="#ffffff"/>
  ${qrSvgWithoutXmlDeclaration}
  <text x="${size / 2}" y="${size + labelHeight / 2 + 10}" font-family="Arial, sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="#000000">Table ${tableNumber}</text>
</svg>`;
}
