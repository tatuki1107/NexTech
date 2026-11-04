"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  getAll,
  ApiError,
  errorMessage,
  type Organization,
  type User,
} from "../_lib/api";
import { broadcastSessionChange } from "@/app/_lib/api";
import { ApiState, BUTTON, CONTROL, LoginRequired } from "./ApiState";
type Workspace = {
  user: User;
  organizations: Organization[];
  organization: Organization;
  select: (id: string) => void;
  reload: () => void;
};
const Context = createContext<Workspace | null>(null);
export const useOrganizer = () => {
  const context = useContext(Context);
  if (!context) throw new Error("OrganizerProvider required");
  return context;
};
function CreateOrganization({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/organizers", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
        }),
      });
      onCreated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">主催者プロフィールを作成</h1>
      <p>所属する主催者がありません。新しい主催者として登録できます。</p>
      <label className="block">
        主催者名
        <input
          name="name"
          required
          maxLength={100}
          className={CONTROL + " block w-full"}
        />
      </label>
      <label className="block">
        識別名（半角英数字・ハイフン）
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxLength={100}
          className={CONTROL + " block w-full"}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} className={BUTTON}>
        {busy ? "登録中…" : "主催者を作成"}
      </button>
    </form>
  );
}
export default function OrganizerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [result, setResult] = useState<{
    user: User;
    organizations: Organization[];
  }>();
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [revision, setRevision] = useState(0);
  const sessionGeneration = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const generation = sessionGeneration.current;
    async function load() {
      try {
        const [user, organizations] = await Promise.all([
          apiRequest<{ data: User }>("/me", { signal: controller.signal }),
          getAll<Organization>("/me/organizers", controller.signal),
        ]);
        if (
          !controller.signal.aborted &&
          generation === sessionGeneration.current
        ) {
          setResult({ user: user.data, organizations });
          try {
            const restored =
              sessionStorage.getItem("nextech-organizer:" + user.data.id) || "";
            setSelectedId((previous) => previous || restored);
          } catch {
            console.warn("主催者の選択状態を復元できませんでした");
          }
          setError("");
          setAnonymous(false);
        }
      } catch (e) {
        if (
          !controller.signal.aborted &&
          generation === sessionGeneration.current
        ) {
          setResult(undefined);
          if (e instanceof ApiError && e.status === 401) setAnonymous(true);
          else setError(errorMessage(e));
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const reset = () => {
      sessionGeneration.current += 1;
      setResult(undefined);
      setAnonymous(true);
    };
    window.addEventListener("nextech-session-expired", reset);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("nextech-session");
    if (channel)
      channel.onmessage = () => {
        reset();
        window.location.reload();
      };
    return () => {
      window.removeEventListener("nextech-session-expired", reset);
      channel?.close();
    };
  }, []);
  const reload = () => setRevision((value) => value + 1);
  if (anonymous)
    return (
      <main className="p-10">
        <LoginRequired />
      </main>
    );
  if (error || !result)
    return (
      <main className="p-10">
        <ApiState error={error} retry={reload} />
      </main>
    );
  if (!result.organizations.length)
    return (
      <main className="p-10">
        <CreateOrganization onCreated={reload} />
      </main>
    );
  const organizations = result.organizations.filter(
    (item) => item.status === "active",
  );
  const organization =
    organizations.find((item) => item.id === selectedId) ?? organizations[0];
  if (!organization)
    return (
      <main className="p-10">
        <p>所属する主催者は現在停止中です。管理者にお問い合わせください。</p>
      </main>
    );
  return (
    <Context.Provider
      value={{
        ...result,
        organizations,
        organization,
        reload,
        select: (id) => {
          try {
            sessionStorage.setItem("nextech-organizer:" + result.user.id, id);
          } catch {
            console.warn("主催者の選択状態を保存できませんでした");
          }
          setSelectedId(id);
          router.push("/organizer");
        },
      }}
    >
      <div key={result.user.id + ":" + organization.id}>{children}</div>
    </Context.Provider>
  );
}
export async function logoutOrganizer() {
  await apiRequest("/auth/logout", { method: "POST" });
  broadcastSessionChange();
  window.location.assign("/login");
}
