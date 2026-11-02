import { AuthForm } from "../_components/AuthForm";
import { ParticipantShell } from "../_components/ParticipantShell";
export default function SignupPage() {
  return (
    <ParticipantShell active="mypage" showBack>
      <AuthForm signup />
    </ParticipantShell>
  );
}
