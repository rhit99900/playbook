import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/store.provider";
import Navigation from "@/components/application/navigation";
import { ThemeSwitcher } from "@/components/application/theme-switcher";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playbook",
  description: "Know what's what!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <nav className="w-full">
              <Navigation />
            </nav>
            <main>
              {children}
            </main>
            <footer className="w-full items-center flex justify-center border-t mx-auto text-center text-xs gap-8 py-2">
              <ThemeSwitcher />
            </footer>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
