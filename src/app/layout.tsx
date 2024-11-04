import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar/Navbar";

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
        <Navbar></Navbar>

        {children}
      </body>
    </html>
  );
}
