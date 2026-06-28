import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/ui/sonner";
import { AuthProvider } from "../components/AuthProvider";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EcoAudit - Community Waste Logger",
  description: "Log and track community waste effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative antialiased selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-slate-950">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-0">
                  <div className="max-w-7xl mx-auto w-full h-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
