import Link from "next/link";

import { CARD_BUTTON } from "../_lib/card-button";
import type { OrganizerEvent } from "../_lib/event";

type EventManagementActionsProps = {
  event: OrganizerEvent;
};

const BASE_PATH = "/organizer/event-management";

export default function EventManagementActions({
  event,
}: EventManagementActionsProps) {
  if (event.status === "ended") {
    return (
      <Link href={`${BASE_PATH}/${event.id}`} className={CARD_BUTTON.brand}>
        詳細
      </Link>
    );
  }

  if (event.status === "draft") {
    return (
      <>
        <Link
          href={`${BASE_PATH}/${event.id}/edit`}
          className={CARD_BUTTON.neutral}
        >
          編集
        </Link>
        {/* 公開と削除の動作は別PRで実装 */}
        <button type="button" className={CARD_BUTTON.success}>
          公開
        </button>
        <button type="button" className={CARD_BUTTON.danger}>
          削除
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href={`${BASE_PATH}/${event.id}/edit`}
        className={CARD_BUTTON.neutral}
      >
        編集
      </Link>
      <Link href={`${BASE_PATH}/${event.id}`} className={CARD_BUTTON.brand}>
        詳細
      </Link>
      {/* 削除の動作は確認モーダルと一緒に別PRで実装 */}
      <button type="button" className={CARD_BUTTON.danger}>
        削除
      </button>
    </>
  );
}
