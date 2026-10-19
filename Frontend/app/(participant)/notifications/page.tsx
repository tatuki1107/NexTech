"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";

const READ_NOTIFICATION_STORAGE_KEY = "nextech-read-notification-titles";

const notifications = [
  {
    title: "申込み完了しました",
    text: "React UI設計ワークショップへの参加申込みを受け付けました。",
    date: "たった今",
    isUnread: true,
  },
  {
    title: "開催前日のリマインド",
    text: "明日13:00からイベントが開催されます。参加方法を確認しましょう。",
    date: "2時間前",
    isUnread: true,
  },
  {
    title: "キャンセル待ち順位が更新されました",
    text: "LLMアプリ開発入門の待機順位が5番になりました。",
    date: "昨日",
    isUnread: false,
  },
  {
    title: "おすすめイベント",
    text: "フォロー中の「生成AI」に新しいイベントが追加されました。",
    date: "3日前",
    isUnread: false,
  },
];

function readReadNotificationTitles() {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(READ_NOTIFICATION_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value) &&
      value.every((item) => typeof item === "string")
      ? value
      : [];
  } catch {
    return [];
  }
}

export default function NotificationsPage() {
  const [readTitles, setReadTitles] = useState<string[]>([]);
  const [hasReadStateLoaded, setHasReadStateLoaded] = useState(false);
  const unreadTitles = notifications
    .filter(
      (notification) =>
        notification.isUnread && !readTitles.includes(notification.title),
    )
    .map((notification) => notification.title);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReadTitles(readReadNotificationTitles());
      setHasReadStateLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasReadStateLoaded) return;
    window.localStorage.setItem(
      READ_NOTIFICATION_STORAGE_KEY,
      JSON.stringify(readTitles),
    );
  }, [hasReadStateLoaded, readTitles]);

  const markAsRead = (title: string) =>
    setReadTitles((titles) =>
      titles.includes(title) ? titles : [...titles, title],
    );
  const markAllAsRead = () =>
    setReadTitles(
      notifications
        .filter((notification) => notification.isUnread)
        .map((notification) => notification.title),
    );

  return (
    <ParticipantShell active="mypage" showBack>
      <section className="notifications-page">
        <div className="page-heading compact-heading">
          <h1>通知</h1>
          <p>新着情報とイベントからのお知らせ</p>
        </div>
        <div className="notification-list">
          {notifications.map((notification) => (
            <Link
              href="/events/react-uiux?state=参加予定"
              className="notification-card"
              key={notification.title}
              onClick={() => markAsRead(notification.title)}
            >
              {unreadTitles.includes(notification.title) ? (
                <span className="notification-bullet" aria-hidden="true" />
              ) : null}
              <div>
                <h2>{notification.title}</h2>
                <p>{notification.text}</p>
                <time>{notification.date}</time>
              </div>
            </Link>
          ))}
        </div>
        <button
          className="mark-all-read"
          type="button"
          onClick={markAllAsRead}
          disabled={unreadTitles.length === 0}
        >
          {unreadTitles.length === 0 ? "すべて既読です" : "すべて既読にする"}
        </button>
      </section>
    </ParticipantShell>
  );
}
