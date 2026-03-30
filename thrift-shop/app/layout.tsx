import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../lib/theme";

export const metadata: Metadata = {
  title: "Mery Rose Clothing - Quality Second-Hand Clothes",
  description: "Sustainable style at affordable prices",
  icons: {
    icon: [
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/images/logo-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/logo-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/images/logo-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4A5A5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          link[rel="icon"], link[rel="apple-touch-icon"] {
            border-radius: 50%;
          }
        `}</style>
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
// Deploy
