import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../lib/theme";

export const metadata: Metadata = {
  title: "Mery Rose Clothing - Quality Second-Hand Clothes",
  description: "Sustainable style at affordable prices",
  icons: {
    icon: "/images/mery-rose-logo.png",
    apple: "/images/mery-rose-logo.png",
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
        <link rel="icon" type="image/png" href="/images/mery-rose-logo.png" />
        <link rel="apple-touch-icon" href="/images/mery-rose-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
