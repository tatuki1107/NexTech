import styles from "../admin.module.css";

export default function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
