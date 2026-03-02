import "@fontsource-variable/inter";
import "@fontsource/dm-mono/latin.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schemapify",
  description: "Create schematic maps on demand.",
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
