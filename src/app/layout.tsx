import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { loadPreferences } from "@/lib/prefs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RJM Furniture — Job & Inventory System",
  description: "Carpentry Job & Inventory Management System",
};

/**
 * `<html lang>` is set from the same locale cookie `src/i18n/request.ts`
 * reads (Requirement 16.11), server-rendered on the first byte of HTML so
 * there is no flash of the other language (design §15.2).
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const messages = await getMessages();
  const prefs = await loadPreferences();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-text-size={prefs.text_size}
      data-high-contrast={prefs.high_contrast ? "on" : "off"}
      data-reduce-motion={prefs.reduce_motion ? "on" : "off"}
      data-visible-focus={prefs.visible_focus ? "on" : "off"}
      data-show-labels={prefs.show_labels ? "on" : "off"}
      data-simple-mode={prefs.simple_mode ? "on" : "off"}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
