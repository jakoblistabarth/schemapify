import "@fontsource-variable/dm-sans";
import "@fontsource-variable/inter";
import "@fontsource/dm-mono/latin.css";
import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mapshaver",
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
