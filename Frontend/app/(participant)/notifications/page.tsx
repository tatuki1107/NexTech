import { ParticipantShell } from "../_components/ParticipantShell";
import { RequireLogin } from "../_components/RequireLogin";
import { NotificationList } from "../_components/NotificationList";
export default function Page() {
  return (
    <ParticipantShell active="mypage" showBack>
      <RequireLogin>
        <NotificationList />
      </RequireLogin>
    </ParticipantShell>
  );
}
