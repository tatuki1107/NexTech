import Sidebar from "./_components/Sidebar";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 文字色の指定がない要素が黒にならないよう、主催者画面の既定色を設定する
    <div className="flex text-fg-neutral-primary">
      <Sidebar />
      <main className="flex-1 px-10 py-12">{children}</main>
    </div>
  );
}
