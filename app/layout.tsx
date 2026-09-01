import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restaurant QR Ordering",
  description: "Scan, order, and track your table's bill in real time.",
};

// Locks pinch-zoom on mobile — without a fixed viewport, phones render the
// admin/waiter dashboards at desktop width and let the user zoom in/out,
// which breaks the fixed/sticky layout instead of just fitting the screen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
