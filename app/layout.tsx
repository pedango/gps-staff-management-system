import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import { APP_LOGO_SRC } from "@/lib/branding";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ghana Police Service — PMS",
  description: "Ghana Police Service — Personnel Management System",
  icons: {
    icon: APP_LOGO_SRC,
    apple: APP_LOGO_SRC,
    shortcut: APP_LOGO_SRC,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
