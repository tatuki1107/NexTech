import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

export function EventImagePlaceholder({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={`event-image ${compact ? "is-compact" : ""}`}
      aria-label="イベント画像未設定"
    >
      <ImageNotSupportedOutlinedIcon />
      <small>NO IMAGE</small>
    </div>
  );
}
