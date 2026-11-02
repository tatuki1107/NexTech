import { ParticipantShell } from "../_components/ParticipantShell";
import { RequireLogin } from "../_components/RequireLogin";
import { ProfileSettings } from "../_components/ProfileSettings";
export default function Page() {
  return (
    <ParticipantShell active="mypage" showBack>
      <RequireLogin>
        <ProfileSettings />
      </RequireLogin>
    </ParticipantShell>
  );
}
