import { DcelStoreProvider } from "@/app/providers/dcel-store-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DcelStoreProvider>{children}</DcelStoreProvider>;
}
