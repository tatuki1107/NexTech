'use client';

import { useState } from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconBuilding,
  IconCalendarEvent,
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconEye,
  IconFileText,
  IconHelpCircle,
  IconLayoutDashboard,
  IconLoader2,
  IconLock,
  IconLogout,
  IconMail,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";

const screens = [
  { id: "registration-complete", group: "認証", label: "新規登録完了", surface: "mobile" },
  { id: "password-reset", group: "認証", label: "パスワード再設定", surface: "mobile" },
  { id: "reset-sent", group: "認証", label: "再設定メール送信完了", surface: "mobile" },
  { id: "new-password", group: "認証", label: "新しいパスワード", surface: "mobile" },
  { id: "reset-complete", group: "認証", label: "パスワード変更完了", surface: "mobile" },
  { id: "privacy-settings", group: "参加者", label: "プライバシー設定", surface: "mobile" },
  { id: "help-contact", group: "参加者", label: "ヘルプ・お問い合わせ", surface: "mobile" },
  { id: "terms-privacy", group: "参加者", label: "利用規約・プライバシー", surface: "mobile" },
  { id: "logout-confirm", group: "参加者", label: "ログアウト確認", surface: "mobile" },
  { id: "participant-states", group: "状態", label: "参加者の空・エラー状態", surface: "mobile" },
  { id: "organizer-login", group: "主催者認証", label: "主催者ログイン", surface: "desktop" },
  { id: "organizer-password-reset", group: "主催者認証", label: "主催者パスワード再設定", surface: "desktop" },
  { id: "organizer-login-error", group: "主催者認証", label: "ログインエラー状態", surface: "desktop" },
  { id: "organizer-setup", group: "主催者認証", label: "主催者組織の初期設定", surface: "desktop" },
  { id: "publish-confirm", group: "主催者", label: "イベント公開確認", surface: "desktop" },
  { id: "publish-complete", group: "主催者", label: "イベント公開完了", surface: "desktop" },
  { id: "event-delete", group: "主催者", label: "イベント中止確認", surface: "desktop" },
  { id: "delete-complete", group: "主催者", label: "イベント中止完了", surface: "desktop" },
  { id: "invite-member", group: "主催者", label: "メンバー招待", surface: "desktop" },
  { id: "invite-sent", group: "主催者", label: "招待送信完了", surface: "desktop" },
  { id: "organization-edit", group: "主催者", label: "組織情報編集", surface: "desktop" },
  { id: "admin-login", group: "管理者", label: "管理者ログイン", surface: "desktop" },
  { id: "admin-moderation", group: "管理者", label: "要対応一覧", surface: "desktop" },
  { id: "admin-suspend-confirm", group: "管理者", label: "公開停止確認", surface: "desktop" },
  { id: "admin-suspend-complete", group: "管理者", label: "公開停止完了", surface: "desktop" },
  { id: "admin-analytics", group: "管理者", label: "基本集計", surface: "desktop" },
  { id: "organizer-states", group: "状態", label: "主催者の空・処理状態", surface: "desktop" },
  { id: "access-denied", group: "状態", label: "権限不足（403）", surface: "desktop" },
  { id: "system-error", group: "状態", label: "システムエラー（500）", surface: "desktop" },
];

const groups = ["認証", "参加者", "主催者認証", "主催者", "管理者", "状態"];

function Brand() {
  return (
    <div className="brand" aria-label="NexTech">
      <span className="brand-mark">N</span>
      <span className="brand-word">NexTech</span>
    </div>
  );
}

function AuthHeader() {
  return <header className="auth-header"><Brand /></header>;
}

function Button({ children, variant = "primary", onClick, icon: Icon }) {
  return (
    <button className={`button button-${variant}`} onClick={onClick}>
      {Icon ? <Icon size={18} stroke={1.9} /> : null}
      <span>{children}</span>
    </button>
  );
}

function Field({ label, placeholder, type = "text", icon: Icon, value, helper }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        <input type={type} placeholder={placeholder} defaultValue={value} />
        {Icon ? <Icon size={18} stroke={1.7} /> : null}
      </span>
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

function PageTitle({ title, subtitle, back }) {
  return (
    <div className="mobile-title-row">
      {back ? <button className="icon-button" aria-label="戻る"><IconArrowLeft size={22} /></button> : null}
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}

function SecurityNote() {
  return <div className="security-note"><IconShieldCheck size={17} /><span>入力情報は安全に保護されます</span></div>;
}

function SuccessBlock({ title, message }) {
  return (
    <div className="success-block">
      <span className="success-icon"><IconCheck size={26} stroke={2.4} /></span>
      <h1>{title}</h1>
      <div className="info-band">{message}</div>
    </div>
  );
}

function RegistrationComplete({ go }) {
  return (
    <div className="mobile-page auth-page">
      <AuthHeader />
      <main className="auth-content completion-content">
        <SuccessBlock title="登録が完了しました" message="アカウントの作成が完了しました。" />
        <div className="button-stack">
          <Button onClick={() => go("participant-states")}>イベントを探す</Button>
          <Button variant="outline" onClick={() => go("privacy-settings")}>プロフィールを設定する</Button>
        </div>
        <SecurityNote />
        <div className="auth-footer"><span>ご登録ありがとうございます</span></div>
      </main>
    </div>
  );
}

function PasswordReset({ go }) {
  return (
    <div className="mobile-page auth-page">
      <AuthHeader />
      <main className="auth-content">
        <PageTitle title="パスワードを再設定" subtitle="登録したメールアドレスを入力してください" />
        <div className="form-stack">
          <Field label="メールアドレス" placeholder="メールアドレスを入力" icon={IconMail} />
          <Button onClick={() => go("reset-sent")}>再設定メールを送信</Button>
        </div>
        <SecurityNote />
        <div className="auth-footer"><button>ログインに戻る</button></div>
      </main>
    </div>
  );
}

function ResetSent({ go }) {
  return (
    <div className="mobile-page auth-page">
      <AuthHeader />
      <main className="auth-content completion-content">
        <div className="mail-icon"><IconMail size={30} /></div>
        <h1 className="center-title">メールを送信しました</h1>
        <div className="info-band multi">taro.yamada@example.com<br /><span>パスワード再設定用のリンクを送信しました。</span></div>
        <div className="button-stack">
          <Button onClick={() => go("new-password")}>メールを確認する</Button>
          <Button variant="outline" onClick={() => go("password-reset")}>メールアドレスを修正</Button>
        </div>
        <button className="text-link">再設定メールを再送</button>
      </main>
    </div>
  );
}

function NewPassword({ go }) {
  return (
    <div className="mobile-page auth-page">
      <AuthHeader />
      <main className="auth-content">
        <PageTitle title="新しいパスワード" subtitle="8文字以上の英数字で設定してください" />
        <div className="form-stack">
          <Field label="新しいパスワード" placeholder="パスワードを入力" type="password" icon={IconEye} helper="8文字以上で入力してください" />
          <Field label="新しいパスワード（確認）" placeholder="もう一度入力" type="password" icon={IconEye} />
          <Button onClick={() => go("reset-complete")}>パスワードを変更</Button>
        </div>
        <SecurityNote />
      </main>
    </div>
  );
}

function ResetComplete() {
  return (
    <div className="mobile-page auth-page">
      <AuthHeader />
      <main className="auth-content completion-content">
        <SuccessBlock title="変更が完了しました" message="新しいパスワードを設定しました。" />
        <div className="button-stack"><Button>ログインする</Button></div>
        <SecurityNote />
      </main>
    </div>
  );
}

function ParticipantHeader({ title }) {
  return (
    <header className="participant-header">
      <button className="icon-button"><IconArrowLeft size={22} /></button>
      <h1>{title}</h1>
      <span className="header-spacer" />
    </header>
  );
}

function Toggle({ label, description, initial = true }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="setting-row">
      <div><strong>{label}</strong>{description ? <small>{description}</small> : null}</div>
      <button className={`toggle ${on ? "on" : ""}`} onClick={() => setOn(!on)} aria-label={label}><span /></button>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div className="mobile-page participant-page">
      <ParticipantHeader title="プライバシー設定" />
      <main className="participant-content">
        <section><h2>プロフィールの公開範囲</h2>
          <div className="choice-list">
            <label><input type="radio" name="scope" defaultChecked /><span><strong>参加したイベントの主催者のみ</strong><small>申込先の主催者にプロフィールを表示します</small></span></label>
            <label><input type="radio" name="scope" /><span><strong>公開しない</strong><small>氏名と連絡先以外は表示されません</small></span></label>
          </div>
        </section>
        <section><h2>データの利用</h2>
          <div className="settings-card">
            <Toggle label="おすすめの最適化" description="閲覧履歴をおすすめに利用します" />
            <Toggle label="サービス改善" description="匿名データを品質改善に利用します" initial={false} />
          </div>
        </section>
        <Button>変更を保存</Button>
      </main>
    </div>
  );
}

function HelpContact() {
  return (
    <div className="mobile-page participant-page">
      <ParticipantHeader title="ヘルプ・お問い合わせ" />
      <main className="participant-content">
        <div className="search-box"><IconSearch size={18} /><input placeholder="質問を検索" /></div>
        <section><h2>よくある質問</h2>
          <div className="menu-card">
            {["イベントへの申し込みについて", "キャンセル・キャンセル待ち", "アカウント・ログイン", "主催者への連絡方法"].map(x => <button key={x}>{x}<IconChevronRight size={18} /></button>)}
          </div>
        </section>
        <section className="contact-box"><IconHelpCircle size={26} /><div><strong>解決しない場合</strong><p>お問い合わせフォームからご連絡ください。</p></div></section>
        <Button variant="outline">お問い合わせフォームへ</Button>
      </main>
    </div>
  );
}

function TermsPrivacy() {
  return (
    <div className="mobile-page participant-page">
      <ParticipantHeader title="利用規約・プライバシー" />
      <main className="participant-content terms-content">
        <div className="segmented"><button className="active">利用規約</button><button>プライバシー</button></div>
        <p className="updated">最終更新日：2026年11月1日</p>
        <h2>第1条（適用）</h2><p>本規約は、NexTechが提供するイベント検索・申込サービスの利用条件を定めるものです。</p>
        <h2>第2条（登録）</h2><p>利用者は、正確な情報を登録し、アカウントを適切に管理するものとします。</p>
        <h2>第3条（禁止事項）</h2><p>他の利用者や主催者に不利益を与える行為、サービス運営を妨害する行為を禁止します。</p>
        <div className="document-link"><IconFileText size={18} /><span>規約全文をダウンロード</span></div>
      </main>
    </div>
  );
}

function LogoutConfirm() {
  return (
    <div className="mobile-page participant-page modal-page">
      <ParticipantHeader title="設定" />
      <main className="participant-content faded"><div className="menu-card"><button>プロフィール編集<IconChevronRight size={18} /></button><button>プライバシー設定<IconChevronRight size={18} /></button><button>ヘルプ・お問い合わせ<IconChevronRight size={18} /></button><button>ログアウト<IconLogout size={18} /></button></div></main>
      <div className="modal-backdrop" />
      <div className="mobile-modal">
        <span className="warning-icon"><IconLogout size={24} /></span>
        <h2>ログアウトしますか？</h2>
        <p>再度利用するにはログインが必要です。</p>
        <Button>ログアウト</Button>
        <Button variant="ghost">キャンセル</Button>
      </div>
    </div>
  );
}

function ParticipantStates() {
  return (
    <div className="mobile-page participant-page">
      <ParticipantHeader title="状態パターン" />
      <main className="participant-content state-list">
        <section className="state-card"><IconSearch size={28} /><div><strong>検索結果がありません</strong><p>条件を変更してもう一度検索してください。</p></div><button>検索条件を変更</button></section>
        <section className="state-card"><IconMail size={28} /><div><strong>通知はまだありません</strong><p>申込状況や開催前のお知らせが届きます。</p></div></section>
        <section className="state-card error"><IconAlertCircle size={28} /><div><strong>読み込めませんでした</strong><p>通信状況を確認して、もう一度お試しください。</p></div><button>再読み込み</button></section>
      </main>
    </div>
  );
}

function OrganizerAuthBrand() {
  return (
    <section className="organizer-auth-brand">
      <div className="organizer-auth-logo"><span>N</span><strong>NexTech</strong></div>
      <div className="organizer-auth-copy">
        <span>ORGANIZER CONSOLE</span>
        <h2>イベント運営を、<br />ひとつの場所で。</h2>
        <p>イベントの公開、申込者の管理、分析までをスムーズに行えます。</p>
      </div>
      <small>© 2026 NexTech</small>
    </section>
  );
}

function OrganizerAuthShell({ children }) {
  return <div className="organizer-auth-page"><OrganizerAuthBrand /><main className="organizer-auth-main">{children}</main></div>;
}

function OrganizerLogin({ go, error = false }) {
  return (
    <OrganizerAuthShell>
      <div className="organizer-auth-card">
        <div className="organizer-auth-heading"><span className="organizer-badge"><IconBuilding size={16} />主催者向け</span><h1>主催者ログイン</h1><p>登録済みの主催者アカウントでログインしてください。</p></div>
        {error ? <div className="organizer-auth-error"><IconAlertCircle size={19} /><div><strong>ログインできませんでした</strong><span>メールアドレスまたはパスワードをご確認ください。</span></div></div> : null}
        <div className="organizer-auth-form">
          <Field label="メールアドレス" placeholder="organizer@example.com" icon={IconMail} value={error ? "organizer@example.com" : undefined} />
          <Field label="パスワード" placeholder="パスワードを入力" type="password" icon={IconEye} value={error ? "password" : undefined} />
          <div className="organizer-auth-options"><label><input type="checkbox" />ログイン状態を保持する</label><button onClick={() => go("organizer-password-reset")}>パスワードを忘れた方</button></div>
          <Button onClick={() => go(error ? "organizer-login" : "organizer-states")}>ログイン</Button>
        </div>
        <div className="organizer-auth-support"><IconShieldCheck size={17} /><span>主催者専用の安全なログイン画面です</span></div>
        <div className="organizer-auth-footer">主催者アカウントをお持ちでない場合は <button>お問い合わせ</button></div>
      </div>
    </OrganizerAuthShell>
  );
}

function OrganizerPasswordReset({ go }) {
  return (
    <OrganizerAuthShell>
      <div className="organizer-auth-card reset">
        <button className="organizer-back" onClick={() => go("organizer-login")}><IconArrowLeft size={18} />ログインに戻る</button>
        <div className="organizer-reset-icon"><IconLock size={25} /></div>
        <div className="organizer-auth-heading"><h1>パスワードを再設定</h1><p>主催者アカウントに登録したメールアドレスを入力してください。</p></div>
        <div className="organizer-auth-form">
          <Field label="メールアドレス" placeholder="organizer@example.com" icon={IconMail} />
          <Button onClick={() => go("organizer-login")}>再設定メールを送信</Button>
        </div>
        <div className="organizer-reset-note">メールが届かない場合は、迷惑メールフォルダまたは登録アドレスをご確認ください。</div>
      </div>
    </OrganizerAuthShell>
  );
}

function AdminSidebar() {
  const items = [[IconLayoutDashboard,"ダッシュボード"],[IconCalendarEvent,"イベント管理"],[IconUsers,"申込管理"],[IconChartBar,"分析レポート"],[IconSettings,"設定"]];
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>N</span><strong>NexTech</strong></div>
      <nav>{items.map(([Icon,label],i)=><button className={i===1?"active":""} key={label}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="admin-account"><span>山</span><div><strong>山田 太郎</strong><small>主催者</small></div></div>
    </aside>
  );
}

function AdminShell({ children, title = "イベント管理", action }) {
  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-topbar"><div><h1>{title}</h1><p>イベントの作成・申込状況を管理します</p></div>{action}</header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

function EventSummary() {
  return (
    <div className="event-summary">
      <span className="status-badge">公開予定</span>
      <h3>生成AIプロダクト勉強会</h3>
      <dl><div><dt>開催日時</dt><dd>2026年11月18日（水）19:00–21:00</dd></div><div><dt>開催形式</dt><dd>オンライン</dd></div><div><dt>定員</dt><dd>80名</dd></div></dl>
    </div>
  );
}

function AdminModal({ icon: Icon, tone = "blue", title, text, children }) {
  return (
    <><div className="admin-dim"/><div className="admin-modal"><span className={`admin-modal-icon ${tone}`}><Icon size={28}/></span><h2>{title}</h2><p>{text}</p>{children}</div></>
  );
}

function PublishConfirm({ go }) {
  return (
    <AdminShell><div className="admin-form-placeholder"><div/><div/><div/></div>
      <AdminModal icon={IconCalendarEvent} title="イベントを公開しますか？" text="公開後、参加者がイベントを検索・申し込みできるようになります。"><EventSummary/><div className="modal-actions"><Button variant="outline">編集に戻る</Button><Button onClick={()=>go("publish-complete")}>公開する</Button></div></AdminModal>
    </AdminShell>
  );
}

function PublishComplete({ go }) {
  return (
    <AdminShell title="イベント公開"><div className="admin-result"><span className="result-icon"><IconCheck size={34}/></span><h2>イベントを公開しました</h2><p>参加者向けのイベントページが公開されました。</p><EventSummary/><div className="result-actions"><Button variant="outline">公開ページを見る</Button><Button onClick={()=>go("invite-member")}>イベント管理へ</Button></div></div></AdminShell>
  );
}

function EventDelete({ go }) {
  return (
    <AdminShell><div className="admin-table-placeholder"><div/><div/><div/><div/></div>
      <AdminModal icon={IconAlertTriangle} tone="red" title="イベントを中止しますか？" text="公開ページは中止表示となり、新しい申し込みは停止されます。申込履歴と操作履歴は保持されます。"><div className="danger-summary"><strong>生成AIプロダクト勉強会</strong><span>申込者 42名</span></div><label className="confirm-check"><input type="checkbox"/>申込者への案内内容を確認しました</label><div className="modal-actions"><Button variant="outline">キャンセル</Button><Button variant="danger" onClick={()=>go("delete-complete")}>イベントを中止</Button></div></AdminModal>
    </AdminShell>
  );
}

function DeleteComplete() {
  return <AdminShell><div className="admin-result compact"><span className="result-icon neutral"><IconAlertTriangle size={30}/></span><h2>イベントを中止しました</h2><p>公開状態を「中止」に変更し、申込・操作履歴を保持しました。</p><Button>イベント一覧へ戻る</Button></div></AdminShell>;
}

function InviteMember({ go }) {
  return (
    <AdminShell title="設定"><div className="admin-panel"><div className="panel-heading"><div><h2>メンバーを招待</h2><p>組織のイベント管理に参加するメンバーを招待します。</p></div><IconUserPlus size={28}/></div><div className="admin-form"><Field label="メールアドレス" placeholder="member@example.com" icon={IconMail}/><label className="field"><span className="field-label">権限</span><select defaultValue="editor"><option value="editor">編集者 — イベントの作成・編集</option><option value="viewer">閲覧者 — 閲覧のみ</option></select></label><div className="permission-note"><IconShieldCheck size={18}/><span>招待されたメンバーには、参加用リンクをメールで送信します。</span></div><div className="panel-actions"><Button variant="outline">キャンセル</Button><Button icon={IconUserPlus} onClick={()=>go("invite-sent")}>招待を送信</Button></div></div></div></AdminShell>
  );
}

function InviteSent() {
  return <AdminShell title="設定"><div className="admin-result"><span className="result-icon"><IconMail size={32}/></span><h2>招待メールを送信しました</h2><p>member@example.com に招待リンクを送信しました。</p><div className="invite-detail"><span>権限</span><strong>編集者</strong><small>有効期限：7日間</small></div><div className="result-actions"><Button variant="outline">招待を再送</Button><Button>メンバー一覧へ</Button></div></div></AdminShell>;
}

function OrganizationEdit() {
  return (
    <AdminShell title="設定"><div className="admin-panel"><div className="panel-heading"><div><h2>組織情報を編集</h2><p>参加者に表示される主催者情報です。</p></div><IconBuilding size={28}/></div><div className="admin-form two-col"><Field label="組織名" value="NexTech Community"/><Field label="表示名" value="NexTech運営事務局"/><Field label="連絡先メール" value="contact@nextech.jp" icon={IconMail}/><Field label="Webサイト" value="https://nextech.jp"/><label className="field full"><span className="field-label">組織紹介</span><textarea defaultValue="テクノロジーを学ぶ人のためのイベントを企画・運営しています。"/></label><div className="panel-actions full"><Button variant="outline">キャンセル</Button><Button>変更を保存</Button></div></div></div></AdminShell>
  );
}

function OrganizerStates() {
  return (
    <AdminShell title="申込管理" action={<Button icon={IconDownload}>CSVエクスポート</Button>}><div className="state-grid"><section className="admin-state-card"><IconUsers size={32}/><h3>申込者はまだいません</h3><p>イベントが公開されると、ここに申込者が表示されます。</p></section><section className="admin-state-card"><IconLoader2 className="spin" size={32}/><h3>CSVを作成しています</h3><p>完了すると自動的にダウンロードされます。</p><div className="progress"><span/></div></section><section className="admin-state-card error"><IconAlertCircle size={32}/><h3>データを取得できませんでした</h3><p>時間をおいてもう一度お試しください。</p><button>再読み込み</button></section></div></AdminShell>
  );
}

function OrganizerSetup({ go }) {
  return (
    <OrganizerAuthShell>
      <div className="organizer-auth-card organizer-setup-card">
        <div className="setup-progress"><span>1</span><div><strong>主催者情報の設定</strong><small>初回ログイン時のみ</small></div></div>
        <div className="organizer-auth-heading"><h1>主催者組織を作成</h1><p>イベントページに表示される組織情報を登録してください。</p></div>
        <div className="organizer-auth-form">
          <Field label="組織名" placeholder="例：NexTech Community" icon={IconBuilding}/>
          <Field label="連絡先メール" placeholder="contact@example.com" icon={IconMail}/>
          <label className="field"><span className="field-label">組織紹介</span><textarea placeholder="活動内容や開催するイベントについて入力" /></label>
          <label className="setup-agreement"><input type="checkbox"/>主催者向け利用規約を確認しました</label>
          <Button onClick={() => go("organizer-states")}>組織を作成して開始</Button>
        </div>
      </div>
    </OrganizerAuthShell>
  );
}

function AdminLogin({ go }) {
  return (
    <div className="system-admin-login">
      <section className="system-admin-intro"><div className="organizer-auth-logo"><span>N</span><strong>NexTech</strong></div><div><span>SERVICE ADMINISTRATION</span><h2>サービス運営管理</h2><p>公開イベント、主催者、参加状況を安全に確認・管理します。</p></div><small>株式会社シップス 運営担当者専用</small></section>
      <main className="system-admin-login-main"><div className="organizer-auth-card"><div className="organizer-auth-heading"><span className="organizer-badge"><IconShieldCheck size={16}/>管理者専用</span><h1>管理者ログイン</h1><p>認可済みの運営アカウントでログインしてください。</p></div><div className="organizer-auth-form"><Field label="メールアドレス" placeholder="admin@example.com" icon={IconMail}/><Field label="パスワード" placeholder="パスワードを入力" type="password" icon={IconEye}/><div className="organizer-auth-options"><label><input type="checkbox"/>この端末を信頼する</label><button>パスワードを忘れた方</button></div><Button onClick={() => go("admin-moderation")}>管理画面へログイン</Button></div><div className="organizer-auth-support"><IconShieldCheck size={17}/><span>操作内容は監査ログに記録されます</span></div></div></main>
    </div>
  );
}

function SystemAdminShell({ title, subtitle = "サービス全体の状態と対応履歴を管理します", action, children }) {
  return (
    <div className="system-admin-page">
      <aside className="system-admin-sidebar"><div className="system-admin-wordmark"><span>N</span><strong>NexTech</strong><small>ADMIN</small></div><nav><button className="active"><IconAlertTriangle size={18}/>要対応</button><button><IconCalendarEvent size={18}/>イベント</button><button><IconBuilding size={18}/>主催者</button><button><IconUsers size={18}/>参加情報</button><button><IconChartBar size={18}/>基本集計</button><button><IconFileText size={18}/>操作履歴</button></nav><div className="system-admin-account"><span>運</span><div><strong>運営 管理者</strong><small>システム管理者</small></div></div></aside>
      <div className="system-admin-main"><header><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</header><main>{children}</main></div>
    </div>
  );
}

function AdminModeration({ go }) {
  const rows = [
    ["生成AIプロダクト勉強会", "NexTech Community", "通報 3件", "要確認"],
    ["クラウド基盤入門", "Cloud Study JP", "内容変更", "確認中"],
    ["学生向けWeb開発会", "Campus Dev", "新規主催者", "確認済み"],
  ];
  return (
    <SystemAdminShell title="要対応"><div className="ops-stats"><div><span>未対応</span><strong>4</strong><small>前日比 +1</small></div><div><span>確認中</span><strong>2</strong><small>担当者対応中</small></div><div><span>本日完了</span><strong>7</strong><small>操作履歴に記録済み</small></div></div><section className="ops-panel"><div className="ops-panel-heading"><div><h2>確認が必要な項目</h2><p>通報、重要な変更、新規主催者を優先順に表示しています。</p></div><button>すべての履歴</button></div><div className="ops-table"><div className="ops-table-head"><span>対象イベント</span><span>主催者</span><span>理由</span><span>状態</span><span /></div>{rows.map((row, index)=><div className="ops-table-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span className={`ops-status status-${index}`}>{row[3]}</span>{index===0?<button onClick={()=>go("admin-suspend-confirm")}>対応する</button>:<button>詳細</button>}</div>)}</div></section></SystemAdminShell>
  );
}

function AdminSuspendConfirm({ go }) {
  return (
    <SystemAdminShell title="イベント詳細"><div className="ops-detail-placeholder"><div/><div/></div><div className="admin-dim"/><div className="ops-modal"><span className="admin-modal-icon red"><IconAlertTriangle size={28}/></span><h2>イベントを公開停止しますか？</h2><p>参加者からは閲覧できなくなります。イベント情報と申込履歴は保持され、対応理由と実行者が操作履歴に記録されます。</p><div className="ops-target"><strong>生成AIプロダクト勉強会</strong><span>NexTech Community</span></div><label className="field"><span className="field-label">対応理由</span><select defaultValue="guideline"><option value="guideline">掲載ガイドライン違反の疑い</option><option value="report">複数の通報を確認</option><option value="other">その他</option></select></label><div className="modal-actions"><Button variant="outline" onClick={()=>go("admin-moderation")}>キャンセル</Button><Button variant="danger" onClick={()=>go("admin-suspend-complete")}>公開停止を実行</Button></div></div></SystemAdminShell>
  );
}

function AdminSuspendComplete({ go }) {
  return <SystemAdminShell title="対応完了"><div className="admin-result"><span className="result-icon"><IconCheck size={34}/></span><h2>イベントを公開停止しました</h2><p>イベントの状態を「公開停止」に変更し、操作履歴へ記録しました。</p><div className="invite-detail"><span>対応ID</span><strong>MOD-2026-1104</strong><small>実行者：運営 管理者</small></div><div className="result-actions"><Button variant="outline">操作履歴を見る</Button><Button onClick={()=>go("admin-moderation")}>要対応一覧へ</Button></div></div></SystemAdminShell>;
}

function AdminAnalytics() {
  return (
    <SystemAdminShell title="基本集計" subtitle="サービス改善に必要な主要指標を確認します" action={<Button icon={IconDownload}>CSV出力</Button>}><div className="ops-stats analytics"><div><span>今月の開催数</span><strong>48</strong><small>先月比 +12%</small></div><div><span>延べ参加者数</span><strong>1,284</strong><small>先月比 +8%</small></div><div><span>平均申込率</span><strong>76%</strong><small>定員に対する割合</small></div></div><div className="analytics-grid"><section className="ops-panel"><div className="ops-panel-heading"><div><h2>月別開催実績</h2><p>直近6か月の開催数と参加者数</p></div><select defaultValue="six"><option value="six">直近6か月</option></select></div><table><thead><tr><th>月</th><th>開催数</th><th>参加者数</th><th>申込率</th></tr></thead><tbody>{[["6月","32","802","68%"],["7月","36","924","71%"],["8月","39","1,015","74%"],["9月","41","1,103","75%"],["10月","43","1,189","76%"],["11月","48","1,284","76%"]].map(r=><tr key={r[0]}>{r.map(c=><td key={c}>{c}</td>)}</tr>)}</tbody></table></section><section className="ops-panel ranking"><div className="ops-panel-heading"><div><h2>人気カテゴリ</h2><p>申込数の多いカテゴリ</p></div></div>{[["生成AI","386"],["Web開発","274"],["クラウド","219"],["データ分析","168"],["キャリア","121"]].map((r,i)=><div className="ranking-row" key={r[0]}><span>{i+1}</span><strong>{r[0]}</strong><small>{r[1]}名</small></div>)}</section></div></SystemAdminShell>
  );
}

function SystemState({ type, go }) {
  const denied = type === "denied";
  return <div className="system-state-page"><div className={`system-state-icon ${denied ? "denied" : "error"}`}>{denied?<IconShieldCheck size={34}/>:<IconAlertCircle size={34}/>}</div><span className="system-state-code">{denied ? "403" : "500"}</span><h1>{denied ? "このページを表示する権限がありません" : "一時的なエラーが発生しました"}</h1><p>{denied ? "ログイン中のアカウントでは、この機能を利用できません。権限が必要な場合は管理者へお問い合わせください。" : "時間をおいてもう一度お試しください。解消しない場合はサポートへお問い合わせください。"}</p><div className="system-state-actions"><Button variant="outline" onClick={()=>go(denied?"organizer-login":"registration-complete")}>{denied?"別のアカウントでログイン":"トップへ戻る"}</Button><Button onClick={()=>go(denied?"organizer-states":"system-error")}>{denied?"前の画面へ戻る":"再読み込み"}</Button></div><small>エラーコード：{denied ? "FORBIDDEN" : "INTERNAL_ERROR"}</small></div>;
}

const renderers = {
  "registration-complete": RegistrationComplete,
  "password-reset": PasswordReset,
  "reset-sent": ResetSent,
  "new-password": NewPassword,
  "reset-complete": ResetComplete,
  "privacy-settings": PrivacySettings,
  "help-contact": HelpContact,
  "terms-privacy": TermsPrivacy,
  "logout-confirm": LogoutConfirm,
  "participant-states": ParticipantStates,
  "organizer-login": OrganizerLogin,
  "organizer-password-reset": OrganizerPasswordReset,
  "organizer-login-error": (props) => <OrganizerLogin {...props} error />,
  "organizer-setup": OrganizerSetup,
  "publish-confirm": PublishConfirm,
  "publish-complete": PublishComplete,
  "event-delete": EventDelete,
  "delete-complete": DeleteComplete,
  "invite-member": InviteMember,
  "invite-sent": InviteSent,
  "organization-edit": OrganizationEdit,
  "admin-login": AdminLogin,
  "admin-moderation": AdminModeration,
  "admin-suspend-confirm": AdminSuspendConfirm,
  "admin-suspend-complete": AdminSuspendComplete,
  "admin-analytics": AdminAnalytics,
  "organizer-states": OrganizerStates,
  "access-denied": (props) => <SystemState {...props} type="denied" />,
  "system-error": (props) => <SystemState {...props} type="error" />,
};

export function App() {
  const [active, setActive] = useState("registration-complete");
  const current = screens.find(s => s.id === active) ?? screens[0];
  const Screen = renderers[active];
  const countLabel = `${screens.length}画面`;

  return (
    <div className="review-app">
      <aside className="review-sidebar">
        <div className="review-heading"><Brand/><p>画面実装レビュー</p><span>{countLabel}・Figma連携済み</span></div>
        <nav className="review-nav">
          {groups.map(group => (
            <section key={group}><h2>{group}</h2>{screens.filter(s=>s.group===group).map(screen => <button key={screen.id} className={screen.id===active?"active":""} onClick={()=>setActive(screen.id)}><span>{screen.label}</span><small>{screen.surface==="mobile"?"393px":"1440px"}</small></button>)}</section>
          ))}
        </nav>
      </aside>
      <main className="review-main">
        <header className="review-topbar"><div><span className="eyebrow">IMPLEMENTATION PREVIEW</span><h1>{current.label}</h1></div><div className="review-status"><span/><strong>既存Figma準拠</strong><small>実装済み</small></div></header>
        <div className={`preview-stage ${current.surface}`}>
          <div className={`preview-frame ${current.surface}`}><Screen go={setActive}/></div>
        </div>
        <footer className="review-footer"><span>← 左の一覧から全画面を確認できます</span><span>ロゴ：Inter Bold / N #0051F5</span></footer>
      </main>
    </div>
  );
}
