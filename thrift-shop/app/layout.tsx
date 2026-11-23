import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/theme";
import FreshStartOnReload from "./components/FreshStartOnReload";

/**
 * The two brand faces, self-hosted.
 *
 * They used to come from a stylesheet on Google's servers: two extra
 * requests before anything could be painted, and a swap that moved the
 * text once the real face arrived. `next/font` downloads the files at
 * build time, serves them from this origin with the stylesheet already in
 * the HTML, and holds the fallback metrics so the swap costs nothing.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-poppins",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-playfair",
});

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
  openGraph: {
    title: "Mery Rose Clothing",
    description: "Sustainable style at affordable prices",
    url: "https://meryrose.me",
    siteName: "Mery Rose",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mery Rose Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mery Rose Clothing",
    description: "Sustainable style at affordable prices",
    images: ["/og-image.png"],
  },
  metadataBase: new URL("https://meryrose.me"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/logo-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/images/logo-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#731528" />
        {/**
         * The catalogue is fetched from the shop's backend, so the
         * connection to it is opened while the page is still being drawn
         * instead of when the products are asked for.
         */}
        <link rel="preconnect" href="https://backend-wild-skylark-9834.fly.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://backend-wild-skylark-9834.fly.dev" />
        <style>{`
          link[rel="icon"], link[rel="apple-touch-icon"] {
            border-radius: 50%;
          }
        `}</style>

        {/**
         * A refresh should start the visitor at the top of the page.
         *
         * The browser keeps the scroll position of the page it is
         * reloading, so a visitor who was halfway down the shop and
         * pressed refresh came back to the middle of the shop — to the
         * lookbook, to the second section, without knowing why.
         *
         * The setting has to be in place before the browser restores the
         * position, which is why this is a plain script in the head of
         * the document rather than something that runs after the page is
         * up. A `next/script` is not enough here: it is handed to the
         * client bundle instead of being written into the HTML.
         *
         * A page opened with an anchor still honours the anchor: the
         * browser is left alone so the deep link can do its job.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (!nav || nav.type !== 'reload') return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <FreshStartOnReload />
      </body>
    </html>
  );
}
// Deploy
