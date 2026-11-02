import { AuthForm } from "../_components/AuthForm";
import { ParticipantShell } from "../_components/ParticipantShell";
export default function LoginPage() {
  return (
    <ParticipantShell active="mypage" showBack>
      <AuthForm />
    </ParticipantShell>
  );
}
