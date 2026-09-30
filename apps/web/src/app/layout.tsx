import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { SunneeHeader } from "@/components/layout/SunneeHeader";
import "./globals.css";

const inter = Inter({ subsets: ["vietnamese", "latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Sunnee — So sánh giá gọi xe",
  description:
    "So sánh giá gọi xe theo thời gian thực tại Việt Nam. Gom báo giá từ nhiều provider, sắp xếp rẻ nhất trước, cập nhật mỗi 60 giây.",
  applicationName: "Sunnee",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#181c24" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-dvh flex-col">
          <SunneeHeader />
          <main className="flex-1">{children}</main>
          <SunneeFooter />
        </div>
      </body>
    </html>
  );
}

function SunneeFooter() {
  return (
    <footer className="mt-10 border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-foreground">Sunnee</span> — MVP tập trung Hà Nội.
        </p>
        <p className="sm:text-right">
          Giá hiển thị mang tính minh hoạ. Bản đồ: © OpenStreetMap · Route: OSRM (chỉ để hiển thị, không tính giá).
        </p>
      </div>
    </footer>
  );
}