import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { AppFeel } from "@/components/AppFeel";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Star Tables",
  description:
    "Earn three stars on every addition, subtraction and times table.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Star Tables",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1748",
  viewportFit: "cover",
  // Fixed at actual size, like an app: no pinch or double-tap zoom.
  // (Safari in a browser tab ignores this; globals.css and AppFeel cover it.)
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppFeel />
        {children}
      </body>
    </html>
  );
}
