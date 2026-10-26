import Sidebar from "./_components/Sidebar";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 px-10 py-12">{children}</main>
    </div>
  );
}
