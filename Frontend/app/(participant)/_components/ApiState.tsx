export function ApiState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  if (loading)
    return (
      <p className="empty-state" role="status">
        読み込み中…
      </p>
    );
  if (error)
    return (
      <div className="empty-state" role="alert">
        <p>{error}</p>
        <button type="button" onClick={retry}>
          再試行
        </button>
      </div>
    );
  return null;
}
