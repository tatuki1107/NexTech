"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import AccountSwitcher from "./AccountSwitcher";

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
    <nav className="flex min-h-screen w-65 flex-col bg-bg-accent-darkblue p-4 text-fg-inverse-primary">
      <div className="flex items-center gap-2 mb-16 px-3 font-bold">
        <div className="text-[36px] text-fg-brand-primary">N</div>
        <div className="text-[24px]">NexTech</div>
      </div>
      <ul className="flex flex-1 flex-col items-center space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-4 rounded-xl w-50 h-14 px-4 py-6 text-xs ${
                  isActive ? "bg-fg-brand-primary" : "hover:bg-[#002A7F]"
                }`}
              >
                <Image src={item.iconSrc} alt="" width={24} height={24} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <AccountSwitcher />
    </nav>
  );
}