import { BookmarkButton } from "@/app/(participant)/_components/BookmarkButton";
import { EventAction } from "@/app/(participant)/_components/EventAction";
import { EventImage } from "@/app/(participant)/_components/EventImage";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

import {
  formatEventDate,
  formatDeadline,
  type EventDetailData,
} from "../_lib/event-detail";

export function EventDetail({
  event,
  onChanged,
}: {
  event: EventDetailData;
  onChanged: () => void;
}) {
  const deadline = formatDeadline(event.applicationDeadline);
  const applicationRate = event.capacity ? Math.min(
    100,
    Math.round((event.applicationCount / event.capacity) * 100),
  ) : 0;
  const isLowSeats = event.seatsLeft <= 3;
  const isLowDeadline =
    deadline.remainingDays !== null && deadline.remainingDays <= 3;

  return (
    <ParticipantShell showBack>
      <article className="event-detail">
        <div className="detail-image-wrap">
          <EventImage eventId={event.id} detail />
          {!event.isArchived && (
            <BookmarkButton eventId={event.id} title={event.title} />
          )}
        </div>
        <div className="detail-body">
          <span className="category-chip">{event.categoryName}</span>
          <h1>{event.title}</h1>
          <dl className="event-meta">
            <div>
              <dt>
                <CalendarTodayOutlinedIcon />
                <span>日時</span>
              </dt>
              <dd>{formatEventDate(event.startAt, event.endAt)}</dd>
            </div>
            <div>
              <dt>
                <FmdGoodOutlinedIcon />
                <span>会場</span>
              </dt>
              <dd>
                {event.format === "online"
                  ? "オンライン"
                  : (event.venueName ?? "会場未定")}
              </dd>
            </div>
            <div>
              <dt>
                <PersonOutlinedIcon />
                <span>定員</span>
              </dt>
              <dd>{event.capacity === null ? "未定" : `${event.capacity}名`}</dd>
            </div>
          </dl>
          {event.capacity !== null && <section
            className="application-status"
            aria-labelledby="application-status-title"
          >
            <p>
              <strong>
                {event.applicationCount} / {event.capacity}名
              </strong>{" "}
              申し込み{" "}
              <span className={isLowSeats ? "is-low-availability" : ""}>
                （残り{event.seatsLeft}枠）
              </span>
            </p>
            <div
              className="application-progress"
              aria-label={`定員${event.capacity}名中${event.applicationCount}名が申し込み`}
            >
              <span style={{ width: `${applicationRate}%` }} />
            </div>
            <p className="application-deadline">
              申込締切 <strong>{deadline.label}</strong>{" "}
              <span className={isLowDeadline ? "is-low-availability" : ""}>
                {deadline.remaining}
              </span>
            </p>
          </section>}
          <section className="description-block">
            <h2>イベント内容</h2>
            <p>{event.description}</p>
          </section>
          {event.participationConditions && (
            <section className="description-block">
              <h2>参加条件</h2>
              <p>{event.participationConditions}</p>
            </section>
          )}
          {event.onlineUrl && /^https?:\/\//i.test(event.onlineUrl) && (
            <section className="description-block">
              <h2>オンライン参加</h2>
              <a
                href={event.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                参加URLを開く
              </a>
            </section>
          )}
        </div>
      </article>
      <EventAction event={event} onChanged={onChanged} />
    </ParticipantShell>
  );
}
