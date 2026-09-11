import QRCode from "qrcode";
import sharp from "sharp";
import * as opentype from "opentype.js";
import TextToSVG from "text-to-svg";
import { ROBOTO_BOLD_TTF_BASE64 } from "./fonts/robotoBold";

export function tableMenuUrl(qrToken: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/menu/${qrToken}`;
}

// Parsed once per lambda instance and reused across requests.
const labelFont = opentype.parse(
  Buffer.from(ROBOTO_BOLD_TTF_BASE64, "base64").buffer as ArrayBuffer,
);
const labelTextToSvg = new TextToSVG(labelFont);

// Builds an SVG (QR + "Table N" label) and rasterizes it to PNG with sharp.
// PNG is used because apps like WhatsApp don't render SVG image previews —
// shared SVGs show up as a blank screen.
//
// The label is drawn as pre-computed vector glyph paths (via text-to-svg /
// opentype.js) rather than an SVG <text> element referencing a font by name:
// serverless hosts (Vercel Lambda) have no system fonts installed, so a
// by-name font falls back to empty "tofu" boxes instead of real letters.
// Baking the glyph outlines in ourselves means rendering never depends on
// what fonts happen to be available on the host.
export async function generateTableQrPng(qrToken: string, tableNumber: number): Promise<Buffer> {
  const url = tableMenuUrl(qrToken);
  const size = 400;
  const labelHeight = 70;

  const qrSvg = await QRCode.toString(url, { type: "svg", width: size, margin: 2 });
  const qrSvgWithoutXmlDeclaration = qrSvg.replace(/<\?xml[^>]*\?>\s*/, "");

  const labelPath = labelTextToSvg.getD(`Table ${tableNumber}`, {
    x: size / 2,
    y: size + labelHeight / 2,
    fontSize: 40,
    anchor: "center middle",
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + labelHeight}" viewBox="0 0 ${size} ${size + labelHeight}">
  <rect width="${size}" height="${size + labelHeight}" fill="#ffffff"/>
  ${qrSvgWithoutXmlDeclaration}
  <path d="${labelPath}" fill="#000000"/>
</svg>`;

  // Render at 2x for crisp printing, then flatten onto white (WhatsApp/JPEG
  // previews handle opaque PNGs more reliably than ones with alpha).
  return sharp(Buffer.from(svg), { density: 288 })
    .resize(size * 2, (size + labelHeight) * 2)
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
}
