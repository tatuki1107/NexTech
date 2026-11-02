import type { ReactNode } from "react";
import styles from "./layout.module.css";
import { ParticipantProvider } from "./_components/ParticipantProvider";

export default function ParticipantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ParticipantProvider>
      <div className={styles.participant}>{children}</div>
    </ParticipantProvider>
  );
}
