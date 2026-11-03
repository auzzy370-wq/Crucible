import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "ENGINEERING GAUNTLET",
  description:
    "Elite full-stack and cybersecurity engineering assessment & qualification platform.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: "#070b12",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster theme="dark" richColors position="top-center" closeButton />
        </Providers>
      </body>
    </html>
  );
}
