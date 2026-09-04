import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/martian-mono/wdth.css";
import { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const martianGrotesk = localFont({
  src: "./fonts/MartianGrotesk[wdth,wght].woff2",
  display: "swap",
  variable: "--font-martian",
  fallback: ["system-ui"],
  weight: "100 900",
});

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
    <html lang="en" className={martianGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
