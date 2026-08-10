export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Restaurant QR Ordering</h1>
      <p className="text-gray-600">
        Customers reach the menu by scanning a table's QR code. Restaurant staff manage
        orders from the{" "}
        <a href="/admin/login" className="text-blue-600 underline">
          admin dashboard
        </a>
        .
      </p>
    </main>
  );
}
