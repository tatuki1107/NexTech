export function EventAction() {
  // Enable these actions only after authenticated registration APIs are available.
  return (
    <div className="sticky-action">
      <button
        className="disabled-action"
        type="button"
        disabled
        aria-describedby="registration-unavailable"
      >
        申込・キャンセルは準備中です
      </button>
      <p id="registration-unavailable" className="registration-notice">
        現在はイベント情報の閲覧のみ利用できます。申込・キャンセルはまだ受け付けていません。
      </p>
    </div>
  );
}
