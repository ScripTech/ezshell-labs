import { AuthProvider } from '@/components/providers/AuthProvider'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import "./xterm.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${ inter.className} light:bg-muted/40 antialiased`}>
        <AuthProvider>
            {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
