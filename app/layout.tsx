import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Admin Portal - ICICI Insurance Management",
  description: "ICICI Insurance Admin Portal & Policy Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
        <AuthProvider>
          {children}
          <Toaster
            theme="light"
            position="top-right"
            richColors
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
