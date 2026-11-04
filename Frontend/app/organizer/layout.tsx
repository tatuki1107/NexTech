import Sidebar from "./_components/Sidebar";
import OrganizerProvider from "./_components/OrganizerProvider";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 文字色の指定がない要素が黒にならないよう、主催者画面の既定色を設定する
    <OrganizerProvider>
      <div className="flex flex-col text-fg-neutral-primary md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">
          {children}
        </main>
      </div>
    </OrganizerProvider>
  );
}
