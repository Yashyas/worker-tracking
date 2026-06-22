import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worker Shift Tracker",
  description: "Track worker attendance and shifts across construction sites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50">{children}</body>
    </html>
  );
}
