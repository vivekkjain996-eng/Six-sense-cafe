import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface BillItem {
  name: string;
  quantity: number;
  lineTotal: number;
}

// pdf-lib's built-in fonts only support WinAnsi encoding, which has no ₹
// glyph — embedding a Unicode font just for the rupee sign isn't worth the
// extra asset, so amounts use "Rs." here (elsewhere in the app, which
// renders in the browser, ₹ displays fine).
function money(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

export async function generateBillPdf({
  restaurantName,
  tableNumber,
  openedAtLabel,
  items,
  subtotal,
  discountPercent,
  discountAmount,
  grandTotal,
  paymentStatus,
}: {
  restaurantName: string;
  tableNumber: number;
  openedAtLabel: string;
  items: BillItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paymentStatus: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const width = 320;
  const margin = 24;
  const lineHeight = 18;
  const rowCount = Math.max(items.length, 1);
  const discountRow = discountPercent > 0 ? 1 : 0;
  const height = 150 + rowCount * lineHeight + (3 + discountRow) * lineHeight + 90;

  const page = pdfDoc.addPage([width, height]);
  let y = height - 32;

  function centered(text: string, useFont = font, size = 10, color = rgb(0, 0, 0)) {
    const textWidth = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font: useFont, color });
    y -= size + 8;
  }

  function row(label: string, value: string, bold = false, color = rgb(0, 0, 0)) {
    const rowFont = bold ? boldFont : font;
    const size = bold ? 12 : 10;
    page.drawText(label, { x: margin, y, size, font: rowFont, color });
    const valueWidth = rowFont.widthOfTextAtSize(value, size);
    page.drawText(value, { x: width - margin - valueWidth, y, size, font: rowFont, color });
    y -= size + 8;
  }

  function divider() {
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 14;
  }

  centered(restaurantName, boldFont, 16);
  centered(`Table ${tableNumber}`, font, 11);
  centered(openedAtLabel, font, 8, rgb(0.45, 0.45, 0.45));

  divider();

  if (items.length === 0) {
    centered("No orders placed on this bill yet.", font, 9, rgb(0.5, 0.5, 0.5));
  } else {
    for (const item of items) {
      row(`${item.quantity}x ${item.name}`, money(item.lineTotal));
    }
  }

  divider();

  row("Subtotal", money(subtotal));
  if (discountPercent > 0) {
    row(`Discount (${discountPercent}%)`, `-${money(discountAmount)}`, false, rgb(0, 0.5, 0));
  }
  row("Grand Total", money(grandTotal), true);

  y -= 6;
  centered(`Payment status: ${paymentStatus}`, font, 9);
  y -= 4;
  centered("Thank you for visiting!", font, 9);

  return pdfDoc.save();
}
