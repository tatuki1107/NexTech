import { BookmarkButton } from "@/app/(participant)/_components/BookmarkButton";
import { EventAction } from "@/app/(participant)/_components/EventAction";
import { EventImagePlaceholder } from "@/app/(participant)/_components/EventImagePlaceholder";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

import {
  formatEventDate,
  formatDeadline,
  type EventDetailData,
} from "../_lib/event-detail";

export function EventDetail({ event }: { event: EventDetailData }) {
  const deadline = formatDeadline(event.applicationDeadline);
  const applicationRate = Math.min(
    100,
    Math.round((event.applicationCount / event.capacity) * 100),
  );
  const isLowSeats = event.seatsLeft <= 3;
  const isLowDeadline =
    deadline.remainingDays !== null && deadline.remainingDays <= 3;

  return (
    <ParticipantShell showBack>
      <article className="event-detail">
        <div className="detail-image-wrap">
          <EventImagePlaceholder />
          <BookmarkButton eventId={event.id} title={event.title} />
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
              <dd>{event.capacity}名</dd>
            </div>
          </dl>
          <section
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
          </section>
          <section className="description-block">
            <h2>イベント内容</h2>
            <p>{event.description}</p>
          </section>
        </div>
      </article>
      <EventAction />
    </ParticipantShell>
  );
}
