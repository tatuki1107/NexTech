import Link from "next/link";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import { MyEvents } from "@/app/(participant)/_components/MyEvents";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";

export default function MyPage() {
  return (
    <ParticipantShell active="mypage">
      <section className="my-page">
        <div className="my-page-title">
          <h1>マイページ</h1>
          <Link href="/settings" aria-label="設定">
            <SettingsOutlinedIcon />
          </Link>
        </div>
        <MyEvents />
        <section className="account-shortcuts" aria-labelledby="account-shortcuts-title">
          <h2 id="account-shortcuts-title">アカウントメニュー</h2>
          <div className="account-shortcut-list">
            <Link href="/interests">
              <span className="account-shortcut-icon" aria-hidden="true"><FavoriteBorderOutlinedIcon /></span>
              <span>興味・フォロー管理</span>
              <span className="account-shortcut-arrow" aria-hidden="true">›</span>
            </Link>
            <Link href="/notifications">
              <span className="account-shortcut-icon" aria-hidden="true"><NotificationsNoneOutlinedIcon /></span>
              <span>通知</span>
              <span className="account-shortcut-arrow" aria-hidden="true">›</span>
            </Link>
          </div>
        </section>
      </section>
    </ParticipantShell>
  );
}
