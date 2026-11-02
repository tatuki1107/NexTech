import { ParticipantShell } from "../_components/ParticipantShell";
import { RequireLogin } from "../_components/RequireLogin";
import { InterestManager } from "../_components/InterestManager";
export default function Page() {
  return (
    <ParticipantShell active="mypage" showBack>
      <RequireLogin>
        <InterestManager />
      </RequireLogin>
    </ParticipantShell>
  );
}
