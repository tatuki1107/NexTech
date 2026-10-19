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
        <section className="account-shortcuts">
          <Link href="/interests">
            <FavoriteBorderOutlinedIcon />
            <span>興味・フォロー管理</span>
            <b>›</b>
          </Link>
          <Link href="/notifications">
            <NotificationsNoneOutlinedIcon />
            <span>通知</span>
            <b>›</b>
          </Link>
        </section>
      </section>
    </ParticipantShell>
  );
}
