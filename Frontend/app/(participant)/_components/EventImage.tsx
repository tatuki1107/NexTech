import Image from "next/image";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

// IDs reserved by the development seed; real events keep their existing fallback.
const DEMO_COVERS = new Map([
  ["43af73f7-1aba-4ae7-8d13-018b22a3e001", "/demo-events/web-api.webp"],
  ["43af73f7-1aba-4ae7-8d13-018b22a3e002", "/demo-events/ui-design.webp"],
  ["43af73f7-1aba-4ae7-8d13-018b22a3e003", "/demo-events/cloud.webp"],
]);

export function EventImage({ eventId, detail = false }: { eventId: string; detail?: boolean }) {
  const cover = DEMO_COVERS.get(eventId);
  if (cover) {
    return (
      <div className="event-image event-cover">
        <Image
          src={cover}
          alt=""
          fill
          sizes={detail ? "(max-width: 430px) calc(100vw - 32px), 398px" : "(max-width: 430px) calc(100vw - 58px), 372px"}
          loading={detail ? "eager" : "lazy"}
        />
      </div>
    );
  }
  return (
    <div
      className="event-image"
      aria-label="イベント画像未設定"
    >
      <ImageNotSupportedOutlinedIcon />
      <small>NO IMAGE</small>
    </div>
  );
}
