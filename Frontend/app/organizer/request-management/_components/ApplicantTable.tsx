import { APPLICANT_STATUS_LABELS, type Applicant } from "../_lib/request";

type ApplicantTableProps = {
  applicants: Applicant[];
};

const CELL = "px-6 py-5";

export default function ApplicantTable({ applicants }: ApplicantTableProps) {
  if (applicants.length === 0) {
    return (
      <p className="rounded-xl border border-ol-neutral-primary bg-white p-8 text-center text-sm text-fg-neutral-secondary">
        申込者がいません。
      </p>
    );
  }

  return (
    <div className="max-h-[calc(100vh-28rem)] overflow-y-auto rounded-xl border border-ol-neutral-primary bg-white">
      <table className="w-full">
        <thead className="sticky top-0 z-10 bg-bg-neutral-primary">
          <tr className="text-left text-sm text-fg-neutral-secondary">
            <th scope="col" className={CELL}>
              参加者
            </th>
            <th scope="col" className={`${CELL} w-40`}>
              申込番号
            </th>
            <th scope="col" className={`${CELL} w-40`}>
              申込日時
            </th>
            <th scope="col" className={`${CELL} w-40`}>
              状態
            </th>
            <th scope="col" className={`${CELL} w-40`}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => (
            <tr
              key={applicant.id}
              className="border-t border-ol-neutral-primary align-middle"
            >
              <td className={CELL}>
                <p className="text-base font-bold text-fg-neutral-primary">
                  {applicant.name}
                </p>
                <p className="mt-1 text-xs text-fg-neutral-secondary">
                  {applicant.email}
                </p>
              </td>
              <td className={`${CELL} text-base text-fg-neutral-primary`}>
                {applicant.requestNumber}
              </td>
              <td className={`${CELL} text-base text-fg-neutral-primary`}>
                {applicant.appliedAt}
              </td>
              <td
                className={`${CELL} text-base font-bold ${
                  applicant.status === "applied"
                    ? "text-fg-accent-green"
                    : "text-fg-neutral-secondary"
                }`}
              >
                {APPLICANT_STATUS_LABELS[applicant.status]}
              </td>
              <td className={CELL}>
                {/* 申込者詳細のモーダルは別PRで実装 */}
                <button
                  type="button"
                  className="flex h-12 w-30 items-center justify-center rounded-xl border-2 border-fg-brand-primary text-base font-bold text-fg-brand-primary"
                >
                  詳細
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
