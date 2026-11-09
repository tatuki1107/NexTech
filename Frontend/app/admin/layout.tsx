import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexTech 管理者",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
