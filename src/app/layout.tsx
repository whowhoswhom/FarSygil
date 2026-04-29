import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarSygil",
  description: "Local-first running command center.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
