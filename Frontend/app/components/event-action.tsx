"use client";

import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import Link from "next/link";
import { useState } from "react";

type EventActionProps = {
  state: string;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    organizerName: string;
  };
};

export function EventAction({ state, event }: EventActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isCancelable = state === "参加予定" || state === "キャンセル待ち";
  const actionLabel = state === "キャンセル待ち" ? "キャンセル待ちに申し込む" : "参加を申し込む";

  if (state === "参加履歴" || state === "キャンセル済み") {
    return <div className="sticky-action"><span className="disabled-action">{state === "参加履歴" ? "参加済みのイベントです" : "キャンセル済みです"}</span></div>;
  }

  return <>
    <div className="sticky-action">
      <button className={isCancelable ? "cancel-action" : "primary-button"} type="button" onClick={() => setIsOpen(true)}>{isCancelable ? "参加をキャンセルする" : actionLabel}</button>
    </div>
    {isOpen ? <div className="modal-backdrop" role="presentation">
      <section className="action-modal request-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h1 id="modal-title">{isCancelable ? "参加をキャンセルしますか？" : "参加を申し込みしますか？"}</h1>
        <dl className="request-modal-details">
          <div className="request-modal-title"><dt className="visually-hidden">タイトル</dt><dd><h2>{event.title}</h2></dd></div>
          <div><dt><CalendarTodayOutlinedIcon /><span>日時</span></dt><dd>{event.date}</dd></div>
          <div><dt><FmdGoodOutlinedIcon /><span>場所</span></dt><dd>{event.location}</dd></div>
          <div><dt><PersonOutlinedIcon /><span>主催</span></dt><dd>{event.organizerName}</dd></div>
        </dl>
        <div className="modal-actions">
          <button className="modal-secondary" type="button" onClick={() => setIsOpen(false)}>キャンセル</button>
          <Link className={isCancelable ? "modal-danger" : "primary-button"} href={isCancelable ? "/mypage" : `/events/${event.id}/complete`}>{isCancelable ? "キャンセルする" : "申し込む"}</Link>
        </div>
      </section>
    </div> : null}
  </>;
}
