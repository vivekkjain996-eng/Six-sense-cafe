"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded bg-blue-600 px-4 py-2 font-medium text-white"
    >
      Print
    </button>
  );
}
