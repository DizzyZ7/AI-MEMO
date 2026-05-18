import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Memo",
  description: "Voice-first diary that turns thoughts into insights, tasks, and patterns.",
  applicationName: "AI Memo",
  appleWebApp: {
    capable: true,
    title: "AI Memo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f7b72",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AppProviders>
          {children}
          <ServiceWorkerRegister />
        </AppProviders>
      </body>
    </html>
  );
}
