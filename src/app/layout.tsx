

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar/Navbar";
import ThemeProvider from "@/helpers/themeProvider";

/* Metaadatok amit a böngésző megkap a weboldalról. SEO-kor hasznos, nekünk ebben a projetkben ez nem fontos */
export const metadata: Metadata = {
  title: "Cisco-WebConfig",
  description: "Cisco eszközökhöz készült webes konfigurációs oldal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider/> {/* Betölti a témát */}
        <Navbar></Navbar>
        {children}
      </body>
    </html>
  );
}
