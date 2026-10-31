import type { Participant } from "../_lib/acceptance";

type ParticipantTableProps = {
  participants: Participant[];
  onCheckIn: (id: string) => void;
  onRequestUndo: (id: string) => void;
};

const CELL = "px-6 py-4";
const ROW_BUTTON =
  "flex h-12 w-50 items-center justify-center rounded-xl border-2 text-base font-bold";

export default function ParticipantTable({
  participants,
  onCheckIn,
  onRequestUndo,
}: ParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <p className="rounded-xl border border-ol-neutral-primary bg-white p-8 text-center text-sm text-fg-neutral-secondary">
        参加者がいません。
      </p>
    );
  }

  return (
    <div className="max-h-[calc(100vh-32rem)] overflow-y-auto rounded-xl border border-ol-neutral-primary bg-white">
      <table className="w-full">
        <thead className="sticky top-0 z-10 bg-bg-neutral-primary">
          <tr className="border-b border-ol-neutral-primary text-left text-sm text-fg-neutral-secondary">
            <th scope="col" className={CELL}>
              参加者氏名
            </th>
            <th scope="col" className={`${CELL} w-50`}>
              申込番号
            </th>
            <th scope="col" className={`${CELL} w-62`}>
              受付
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr
              key={participant.id}
              className="border-t border-ol-neutral-primary align-middle"
            >
              <td className={CELL}>
                <p className="text-xs text-fg-neutral-secondary">
                  {participant.nameKana}
                </p>
                <p className="text-base text-fg-neutral-primary">
                  {participant.name}
                </p>
              </td>
              <td className={`${CELL} text-base text-fg-neutral-primary`}>
                {participant.requestNumber}
              </td>
              <td className={CELL}>
                {participant.isCheckedIn ? (
                  <button
                    type="button"
                    aria-label={`${participant.name} 受付済(押すと取り消し)`}
                    onClick={() => onRequestUndo(participant.id)}
                    className={`${ROW_BUTTON} border-fg-accent-green bg-bg-accent-green text-fg-accent-green`}
                  >
                    受付済
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`${participant.name}を受付する`}
                    onClick={() => onCheckIn(participant.id)}
                    className={`${ROW_BUTTON} border-fg-brand-primary bg-fg-brand-primary text-fg-inverse-primary`}
                  >
                    受付する
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
