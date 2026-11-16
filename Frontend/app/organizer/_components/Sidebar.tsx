"use client";

import Image from "next/image";
import Link from "next/link";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import { useState } from "react";
import { usePathname } from "next/navigation";

import AccountSwitcher from "./AccountSwitcher";

type MenuItem = {
  label: string;
  href: string;
  iconSrc: string;
};

const menuItems: MenuItem[] = [
  {
    label: "ダッシュボード",
    href: "/organizer",
    iconSrc: "/icons/dashboardIcon.svg",
  },
  {
    label: "イベント管理",
    href: "/organizer/event-management",
    iconSrc: "/icons/eventManagementIcon.svg",
  },
  {
    label: "申込管理",
    href: "/organizer/request-management",
    iconSrc: "/icons/requestManagementIcon.svg",
  },
  {
    label: "当日受付",
    href: "/organizer/acceptance",
    iconSrc: "/icons/acceptanceIcon.svg",
  },
  {
    label: "分析レポート",
    href: "/organizer/analytics-report",
    iconSrc: "/icons/analyticsReportIcon.svg",
  },
  {
    label: "設定",
    href: "/organizer/settings",
    iconSrc: "/icons/settingsIcon_wh.svg",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const expanded = expandedPath === pathname;

  return (
    <nav className="flex w-full shrink-0 flex-col bg-bg-accent-darkblue p-4 text-fg-inverse-primary md:sticky md:top-0 md:h-screen md:w-65 md:self-start">
      <div className="flex items-center gap-2 font-bold md:mb-16 md:px-3">
        <div aria-hidden="true" className="hidden text-[36px] text-fg-brand-primary md:block">N</div>
        <div className="text-xl md:text-[24px]">NexTech</div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="organizer-navigation"
          onClick={() => setExpandedPath(expanded ? null : pathname)}
          className="ml-auto flex min-h-11 items-center gap-2 rounded-lg border border-white/40 px-3 text-sm md:hidden"
        >
          <MenuOutlined fontSize="small" aria-hidden="true" /> メニュー
        </button>
      </div>
      <div id="organizer-navigation" className={`${expanded ? "flex" : "hidden"} flex-col md:flex md:min-h-0 md:flex-1`}>
        <ul className="mt-3 grid grid-cols-2 gap-2 md:mt-0 md:flex md:flex-1 md:flex-col md:items-center md:overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/organizer"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setExpandedPath(null)}
                  className={`flex items-center min-h-11 gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm md:h-14 md:w-50 md:gap-4 md:rounded-xl md:border-0 md:px-4 md:text-xs ${
                    isActive ? "bg-fg-brand-primary" : "hover:bg-[#002A7F]"
                  }`}
                >
                  <Image src={item.iconSrc} alt="" width={24} height={24} className="hidden md:block" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <AccountSwitcher />
      </div>
    </nav>
  );
}
