import { BookmarkButton } from "../../components/bookmark-button";
import { EventAction } from "../../components/event-action";
import { EventImagePlaceholder, UserShell } from "../../components/user-shell";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

type EventDetail = {
  id: string;
  title: string;
  description: string;
  format: string;
  venueName: string | null;
  startAt: string;
  endAt: string;
  applicationDeadline: string | null;
  capacity: number;
  categoryName: string;
  organizerName: string;
  applicationCount: number;
  seatsLeft: number;
};

const fallbackEvent: EventDetail = {
  id: "react-uiux",
  title: "React UI設計ワークショップ",
  description: "実践を交えながら、初めての方にも分かりやすく学べるイベントです。参加者同士で交流しながら、新しい知識とつながりを作りましょう。",
  format: "online",
  venueName: null,
  startAt: "2026-06-15T13:00:00+09:00",
  endAt: "2026-06-15T16:00:00+09:00",
  applicationDeadline: "2026-06-13T23:59:00+09:00",
  capacity: 40,
  categoryName: "テクノロジー",
  organizerName: "NexTech Community",
  applicationCount: 32,
  seatsLeft: 8,
};

function isEventDetail(value: unknown): value is EventDetail {
  return typeof value === "object" && value !== null
    && "id" in value && typeof value.id === "string"
    && "title" in value && typeof value.title === "string"
    && "description" in value && typeof value.description === "string"
    && "format" in value && typeof value.format === "string"
    && "venueName" in value && (typeof value.venueName === "string" || value.venueName === null)
    && "startAt" in value && typeof value.startAt === "string"
    && "endAt" in value && typeof value.endAt === "string"
    && "applicationDeadline" in value && (typeof value.applicationDeadline === "string" || value.applicationDeadline === null)
    && "capacity" in value && typeof value.capacity === "number"
    && "categoryName" in value && typeof value.categoryName === "string"
    && "organizerName" in value && typeof value.organizerName === "string"
    && "applicationCount" in value && typeof value.applicationCount === "number"
    && "seatsLeft" in value && typeof value.seatsLeft === "number";
}

function formatEventDate(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "日時未定";
  const date = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" }).format(start);
  const time = (value: Date) => value.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time(start)} - ${time(end)}`;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return { label: "設定なし", remaining: "", remainingDays: null };
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return { label: "設定なし", remaining: "", remainingDays: null };
  const remainingDays = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const dateLabel = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" }).format(date);
  const timeLabel = date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false });
  return { label: `${dateLabel} ${timeLabel}`, remaining: `（残り${remainingDays}日）`, remainingDays };
}

async function getEventDetail(id: string) {
  const apiBaseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${apiBaseUrl}/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!response.ok) return fallbackEvent;
    const value: unknown = await response.json();
    return typeof value === "object" && value !== null && "event" in value && isEventDetail(value.event) ? value.event : fallbackEvent;
  } catch {
    return fallbackEvent;
  }
}

export default async function EventDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ state?: string }> }) {
  const { id } = await params;
  const { state = "申込可能" } = await searchParams;
  const event = await getEventDetail(id);
  const deadline = formatDeadline(event.applicationDeadline);
  const applicationRate = Math.min(100, Math.round((event.applicationCount / event.capacity) * 100));
  const isLowSeats = event.seatsLeft <= 3;
  const isLowDeadline = deadline.remainingDays !== null && deadline.remainingDays <= 3;

  return (
    <UserShell showBack>
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
              <span>
                日時
              </span>
              </dt>
                <dd>
                  {formatEventDate(event.startAt, event.endAt)}
                </dd>
            </div>
            <div>
              <dt>
                <FmdGoodOutlinedIcon />
                <span>会場</span>
              </dt>
              <dl>{event.format === "online" ? "オンライン" : event.venueName ?? "会場未定"}</dl></div>
              <div>
                <dt><PersonOutlinedIcon />
                    <span>定員</span>
                </dt>
                <dd>{event.capacity}名</dd>
              </div>
              </dl>
          <section className="application-status" aria-labelledby="application-status-title"><p><strong>{event.applicationCount} / {event.capacity}名</strong> 申し込み <span className={isLowSeats ? "is-low-availability" : ""}>（残り{event.seatsLeft}枠）</span></p><div className="application-progress" aria-label={`定員${event.capacity}名中${event.applicationCount}名が申し込み`}><span style={{ width: `${applicationRate}%` }} /></div><p className="application-deadline">申込締切 <strong>{deadline.label}</strong> <span className={isLowDeadline ? "is-low-availability" : ""}>{deadline.remaining}</span></p></section>
          <section className="description-block"><h2>イベント内容</h2><p>{event.description}</p></section>
        </div>
      </article>
      <EventAction state={state} event={{ id: event.id, title: event.title, date: formatEventDate(event.startAt, event.endAt), location: event.format === "online" ? "オンライン" : event.venueName ?? "会場未定", organizerName: event.organizerName }} />
    </UserShell>
  );
}
