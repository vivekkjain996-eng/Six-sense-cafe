"use client";

import { useState } from "react";

interface BillItem {
  name: string;
  quantity: number;
  lineTotal: number;
}

export default function ShareWhatsAppButton({
  restaurantName,
  tableNumber,
  items,
  subtotal,
  discountPercent,
  discountAmount,
  grandTotal,
}: {
  restaurantName: string;
  tableNumber: number;
  items: BillItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
}) {
  const [phone, setPhone] = useState("");

  function buildMessage() {
    const lines = [
      `🧾 *${restaurantName}*`,
      `Table ${tableNumber} — Bill`,
      "",
      ...items.map((i) => `${i.quantity}x ${i.name} - ₹${i.lineTotal.toFixed(2)}`),
      "",
      `Subtotal: ₹${subtotal.toFixed(2)}`,
    ];
    if (discountPercent > 0) {
      lines.push(`Discount (${discountPercent}%): -₹${discountAmount.toFixed(2)}`);
    }
    lines.push(`*Grand Total: ₹${grandTotal.toFixed(2)}*`, "", "Thank you for visiting! 🙏");
    return lines.join("\n");
  }

  function share() {
    const text = encodeURIComponent(buildMessage());
    const digitsOnly = phone.replace(/\D/g, "");
    // No number entered: wa.me opens WhatsApp's own contact picker with the message pre-filled.
    const target = digitsOnly ? (digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly) : "";
    window.open(`https://wa.me/${target}?text=${text}`, "_blank");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Customer's number (optional)"
        className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        onClick={share}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
      >
        📱 Share on WhatsApp
      </button>
    </div>
  );
}
