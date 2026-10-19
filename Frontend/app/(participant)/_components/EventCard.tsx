import Link from "next/link";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { BookmarkButton } from "./BookmarkButton";
import { EventImagePlaceholder } from "./EventImagePlaceholder";

export function EventCard({
  eventId,
  title,
  date,
  location,
  category,
  seatsLeft,
  organizer,
}: {
  eventId: string;
  title: string;
  date: string;
  location: string;
  category: string;
  seatsLeft: number;
  organizer: string;
}) {
  return (
    <article className="event-card">
      <div className="event-card-topline">
        <span className="category-chip">{category}</span>
        <span className="seats-left">残り {seatsLeft} 席</span>
      </div>
      <EventImagePlaceholder />
      <div className="event-card-body">
        <h2>{title}</h2>
        <p>
          <CalendarTodayOutlinedIcon /> {date}
        </p>
        <p>
          <PlaceOutlinedIcon /> {location}
        </p>
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
