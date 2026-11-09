import styles from "../admin.module.css";

export default function AdminDataState({
  message,
  reload,
}: {
  message?: string;
  reload?: () => void;
}) {
  if (!message)
    return (
      <p className={styles.state} role="status">
        読み込み中…
      </p>
    );
  return (
    <div className={styles.state} role={reload ? "alert" : undefined}>
      <p>{message}</p>
      {reload && (
        <button className={styles.button} onClick={reload}>
          再試行
        </button>
      )}
    </div>
  );
}
