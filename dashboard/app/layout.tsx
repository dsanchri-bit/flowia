import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowIA Intelligence",
  description: "Plataforma de análisis empresarial inteligente con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" translate="no">
      <body translate="no" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}