import { AuthProvider } from '@/components/providers/AuthProvider'
import { AuthErrorHandler } from '@/components/providers/AuthErrorHandler'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"

// const inter = Inter({ subsets: ["latin"] });${ inter.className}

export const metadata: Metadata = {
  title: "eZetsu-Labs @ ezShell",
  description: "Edilson Mucanze - DevOps",
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
      </body>
    </html>
  );
}
