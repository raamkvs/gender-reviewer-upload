import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gender Reviewer — Document Upload",
  description: "Upload documents for an existing Gender Reviewer session",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-undp-blue-pale antialiased">{children}</body>
    </html>
  );
}
