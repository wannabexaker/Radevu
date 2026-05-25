import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex"
});

export const metadata: Metadata = {
  title: "Radevu",
  description:
    "Ψηφιακή γραμματεία για μικρές επιχειρήσεις υπηρεσιών."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html className={plex.variable} lang="el">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
