"use client";

import { useState } from "react";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";

const categories = [
  "フロントエンド",
  "バックエンド",
  "生成AI",
  "UI/UX",
  "キャリア",
];
const organizers = [
  ["株", "株式会社シップス", "フロントエンド・UI設計"],
  ["株", "株式会社パシタン", "生成AI・バックエンド"],
  ["T", "TechBase Nagoya", "コミュニティ・キャリア"],
];

export default function InterestsPage() {
  const [followedOrganizers, setFollowedOrganizers] = useState(() =>
    organizers.map(([, name]) => name),
  );
  return (
    <ParticipantShell active="mypage" showBack>
      <section className="interest-page">
        <div className="page-heading compact-heading">
          <h1>興味・フォロー</h1>
          <p>おすすめに表示するカテゴリと主催者を管理できます</p>
        </div>
        <h2>カテゴリー</h2>
        <div className="chip-grid">
          {categories.map((category, index) => (
            <label className="selectable-chip" key={category}>
              <input type="checkbox" defaultChecked={index < 3} />
              <span>{category}</span>
            </label>
          ))}
          <button className="filter-chip" type="button">
            ＋ 追加
          </button>
        </div>
        <h2>主催者</h2>
        <div className="follow-list">
          {organizers.map(([initial, name, detail]) => {
            const isFollowed = followedOrganizers.includes(name);
            return (
              <div key={name}>
                <span className="avatar small-avatar">{initial}</span>
                <p>
                  <b>{name}</b>
                  <small>{detail}</small>
                </p>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() =>
                    setFollowedOrganizers((current) =>
                      isFollowed
                        ? current.filter((organizer) => organizer !== name)
                        : [...current, name],
                    )
                  }
                >
                  {isFollowed ? "フォロー中" : "フォローする"}
                </button>
              </div>
            );
          })}
        </div>
        <button className="find-organizer-button" type="button">
          主催者を探す
        </button>
      </section>
    </ParticipantShell>
  );
}
