import QRCode from "qrcode";

export function tableMenuUrl(qrToken: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/menu/${qrToken}`;
}

export async function generateTableQrPng(qrToken: string): Promise<Buffer> {
  const url = tableMenuUrl(qrToken);
  return QRCode.toBuffer(url, { type: "png", width: 400, margin: 2 });
}
