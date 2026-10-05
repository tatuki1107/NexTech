"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import Link from "next/link";
import { useState } from "react";

type Tab = "参加予定" | "キャンセル待ち" | "参加履歴";

type MyEvent = {
  category: string;
  detail: string;
  title: string;
  state: "参加予定" | "キャンセル待ち" | "参加履歴";
};

const tabData: Record<Tab, MyEvent[]> = {
  "参加予定": [
    { category: "フロントエンド", detail: "残り8席", title: "React UI設計ワークショップ", state: "参加予定" },
    { category: "生成AI", detail: "残り12席", title: "LLMアプリ開発入門", state: "参加予定" },
    { category: "キャリア", detail: "残り5席", title: "エンジニアのためのキャリア設計", state: "参加予定" },
  ],
  "キャンセル待ち": [
    { category: "生成AI", detail: "現在4番目", title: "LLMアプリ開発入門", state: "キャンセル待ち" },
    { category: "フロントエンド", detail: "現在2番目", title: "React UI設計ワークショップ", state: "キャンセル待ち" },
    { category: "UI/UX", detail: "現在6番目", title: "デザインシステム入門", state: "キャンセル待ち" },
  ],
  "参加履歴": [
    { category: "UI/UX", detail: "参加済み", title: "Webデザイン基礎講座", state: "参加履歴" },
    { category: "バックエンド", detail: "参加済み", title: "API設計ワークショップ", state: "参加履歴" },
  ],
};

export function MyEvents() {
  const [activeTab, setActiveTab] = useState<Tab>("参加予定");
  const events = tabData[activeTab];
  return <>
    <div className="profile-summary"><div className="avatar">山</div><div><b>山田 太郎</b><p>参加予定 4件・キャンセル待ち 4件</p></div></div>
    <div className="segmented-tabs" role="tablist">{(Object.keys(tabData) as Tab[]).map((tab) => <button className={tab === activeTab ? "is-active" : ""} type="button" onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div>
    <div className="my-event-list">{events.map((event) => <article className="my-event-card" key={`${activeTab}-${event.title}`}><div className="my-event-top"><span className="category-chip">{event.category}</span><span>{event.detail}</span></div><div className="my-event-image">NO IMAGE</div><h2>{event.title}</h2><p><CalendarTodayOutlinedIcon /> 6/14（土）13:00 - 16:00</p><p><LocationOnOutlinedIcon /> 名古屋 / オンライン</p><p><PersonOutlineOutlinedIcon /> 株式会社シップス</p><footer><Link className="detail-button" href={`/events/react-uiux?state=${event.state}`}>詳細を見る</Link><BookmarkIcon /></footer></article>)}</div>
    {activeTab === "参加履歴" ? <section className="history-following"><h2>フォロー中</h2><p>カテゴリー</p><div><span>フロントエンド</span><span>バックエンド</span><span>生成AI</span><span>＋1 選択</span></div><p>主催者</p><div><span>株式会社シップス</span><span>株式会社パシタン</span><span>田中太郎</span><span>＋追加</span></div></section> : null}
  </>;
}
