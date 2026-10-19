import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexTech",
  description: "イベント管理サービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
