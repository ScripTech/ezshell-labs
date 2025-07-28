import { AuthProvider } from '@/components/providers/AuthProvider'
import { AuthErrorHandler } from '@/components/providers/AuthErrorHandler'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"
import { GoogleAnalytics } from '@next/third-parties/google'

// const inter = Inter({ subsets: ["latin"] });${ inter.className}

export const metadata: Metadata = {
  title: "EzShell Labs",
  description: "Hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.",
  openGraph: {
    title: "EzShell Labs",
    description: "Hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.",
    url: "https://ezshelllabs.com/",
    siteName: "EzShell Labs",
    images: [
      {
        url: "https://emucanze.com/og-image.svg",
        width: 1200,
        height: 630,
        alt: "EzShell Open Graph Image Labs"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "EzShell Labs",
    description: "Hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.",
    site: "@ezshelllabs",
    creator: "@edilsonmucanze",
    images: ["https://emucanze.com/og-image.svg"]
  },
  metadataBase: new URL("https://emucanze.com/")
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`light:bg-muted/40 antialiased`}>
        <AuthProvider>
          <AuthErrorHandler>
            {children}
          </AuthErrorHandler>
        </AuthProvider>
        <Toaster />
        <GoogleAnalytics gaId="G-ZVZ9ZHZ3VL" />
      </body>
    </html>
  );
}
