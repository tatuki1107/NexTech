import type { ReactNode } from "react";
import styles from "./layout.module.css";

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return <div className={styles.participant}>{children}</div>;
}
