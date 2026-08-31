import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xintrex Health Portal",
  description: "Hospital Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-white antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}