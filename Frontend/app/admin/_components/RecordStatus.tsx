import { SECTIONS } from "../_lib/records";
import type { RecordSection } from "../_lib/records";
import styles from "../admin.module.css";

export default function RecordStatus({
  section,
  status,
}: {
  section: RecordSection;
  status: string;
}) {
  const labels: Record<string, string> = SECTIONS[section].statuses;
  const tone = ["published", "active", "confirmed"].includes(status)
    ? "positive"
    : ["pending", "waitlisted"].includes(status)
      ? "pending"
      : ["cancelled", "no_show"].includes(status)
        ? "negative"
        : status === "checked_in"
          ? "info"
          : "neutral";
  return (
    <span className={styles.badge} data-tone={tone}>
      {labels[status] ?? status}
    </span>
  );
}
