"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
  iconSrc: string;
};

// リンクは仮
const menuItems: MenuItem[] = [
  { label: "ダッシュボード", href: "/organizer", iconSrc: "/icons/dashboardIcon.svg" },
  { label: "イベント管理", href: "/organizer/event-management", iconSrc: "/icons/eventManagementIcon.svg" },
  { label: "申込管理", href: "/organizer/request-management", iconSrc: "/icons/requestManagementIcon.svg" },
  { label: "当日受付", href: "/organizer/acceptance", iconSrc: "/icons/acceptanceIcon.svg" },
  { label: "分析レポート", href: "/organizer/analytics-report", iconSrc: "/icons/analyticsReportIcon.svg" },
  { label: "設定", href: "/organizer/settings", iconSrc: "/icons/settingsIcon_wh.svg" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="min-h-screen w-65 bg-[#011B40] p-4 text-white">
      <div className="flex items-center gap-2 mb-16 px-3 font-bold">
        <div className="text-[36px] text-[#0051F5]">N</div>
        <div className="text-[24px]">NexTech</div>
      </div>
      <ul className="flex flex-col items-center space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-4 rounded w-50 h-14 px-4 py-6 text-xs ${
                  isActive ? "bg-[#0051F5]" : "hover:bg-[#002A7F]"
                }`}
              >
                <Image src={item.iconSrc} alt="" width={24} height={24} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}