import Link from "next/link";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { getEventFormatLabel } from "../_lib/event-format";
import { BookmarkButton } from "./BookmarkButton";
import { EventImage } from "./EventImage";

export function EventCard({
  eventId,
  title,
  date,
  format,
  venueName,
  category,
  seatsLeft,
  organizer,
}: {
  eventId: string;
  title: string;
  date: string;
  format: string | null;
  venueName: string | null;
  category: string;
  seatsLeft?: number;
  organizer: string;
}) {
  const formatLabel = getEventFormatLabel(format);
  return (
    <article className="event-card">
      <div className="event-card-topline">
        <div className="event-card-labels">
          <span className="category-chip">{category}</span>
          {formatLabel && <span className="event-format-badge">{formatLabel}</span>}
        </div>
        {seatsLeft !== undefined && <span className="seats-left">残り {seatsLeft} 席</span>}
      </div>
      <EventImage eventId={eventId} />
      <div className="event-card-body">
        <h2>{title}</h2>
        <p>
          <CalendarTodayOutlinedIcon /> {date}
        </p>
        {format !== "online" && (
          <p>
            <PlaceOutlinedIcon /> {venueName ?? "会場未定"}
          </p>
        )}
        <p className="organizer-name">
          <HomeOutlinedIcon /> {organizer}
        </p>
      </div>
      <footer className="event-card-footer">
        <Link className="detail-button" href={`/events/${eventId}`}>
          詳細を見る
        </Link>
        <BookmarkButton eventId={eventId} title={title} />
      </footer>
    </article>
  );
}
