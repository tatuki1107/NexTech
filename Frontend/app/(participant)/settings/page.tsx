import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <label className="toggle">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span />
    </label>
  );
}

export default function SettingsPage() {
  return (
    <ParticipantShell active="mypage" showBack>
      <section className="settings-page">
        <h1>設定</h1>
        <h2>アカウント</h2>
        <button className="account-row" type="button">
          <span className="avatar">山</span>
          <span>
            <b>山田 太郎</b>
            <small>プロフィールを編集</small>
          </span>
          <b>›</b>
        </button>
        <h2>通知</h2>
        <div className="settings-list">
          <div>
            <span>
              <b>申込・キャンセル情報</b>
              <small>イベント申込の状態変更</small>
            </span>
            <Toggle defaultChecked />
          </div>
          <div>
            <span>
              <b>開催リマインド</b>
              <small>開催前日と1時間前</small>
            </span>
            <Toggle defaultChecked />
          </div>
          <div>
            <span>
              <b>おすすめ情報</b>
              <small>フォロー内容に基づく案内</small>
            </span>
            <Toggle />
          </div>
        </div>
        <h2>その他</h2>
        <div className="menu-list">
          <button type="button">
            プライバシー設定 <b>›</b>
          </button>
          <button type="button">
            利用規約・プライバシーポリシー <b>›</b>
          </button>
          <button type="button">
            ヘルプ・お問い合わせ <b>›</b>
          </button>
        </div>
        <button className="logout-button" type="button">
          ログアウト
        </button>
      </section>
    </ParticipantShell>
  );
}
