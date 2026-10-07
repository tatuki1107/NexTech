import Link from 'next/link';

type MenuItem = {
  label: string;
  href: string;
};

const menuItems: MenuItem[] = [
  { label: "ダッシュボード", href: "/organizer" },
  { label: "イベント管理", href: "/organizer/events" },
  { label: "参加者", href: "/organizer/attendees" },
];

export default function Sidebar() {
  return (
    <nav className="min-h-screen w-64 bg-[#011B40] p-4 text-white">
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded px-3 py-2 hover:bg-[#1d4698]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}