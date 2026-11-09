"use client";
import Link from "next/link";
import { useApiData } from "../_lib/use-api-data";
import type { ParticipantEvent, Registration } from "../_lib/types";
import { EventDetail } from "./EventDetail";
import { ApiState } from "./ApiState";
import { ParticipantShell } from "./ParticipantShell";
import { useParticipant } from "./ParticipantProvider";
function RegistrationDetail({ id }: { id: string }) {
  const { data, loading, error, reload } = useApiData<Registration[]>(
    "/me/registrations",
    true,
  );
  const registration = data?.find((row) => row.eventId === id);
  if (!registration)
    return (
      <ParticipantShell showBack>
        <ApiState loading={loading} error={error} retry={reload} />
        {data && <p className="empty-state">イベントが見つかりません。</p>}
        <Link href="/mypage">マイページへ戻る</Link>
      </ParticipantShell>
    );
  return (
    <EventDetail
      onChanged={reload}
      event={{
        ...registration.event,
        effectiveStartAt: registration.effectiveStartAt,
        registrationStatus:
          registration.status === "cancelled" ? null : registration.status,
        isArchived: true,
        description:
          "このイベントは現在公開されていません。以下はご自身の申込履歴です。",
        categoryName: registration.event.category?.name ?? "カテゴリ未設定",
        organizerName: registration.event.organizer.name,
        applicationDeadline: null,
        applicationCount: registration.event.confirmedCount,
        seatsLeft: Math.max(
          0,
          (registration.event.capacity ?? 0) - registration.event.confirmedCount,
        ),
      }}
    />
  );
}

export function EventDetailLoader({ id }: { id: string }) {
  const session = useParticipant();
  const { data, loading, error, errorStatus, reload } = useApiData<{
    data: ParticipantEvent;
  }>(
    `/events/${encodeURIComponent(id)}`,
    false,
    session.user?.id ?? "guest",
    !session.loading,
  );
  if (errorStatus === 404 && session.user)
    return <RegistrationDetail id={id} />;
  if (!data)
    return (
      <ParticipantShell showBack>
        <ApiState loading={loading} error={error} retry={reload} />
        <Link href="/">イベント一覧へ戻る</Link>
      </ParticipantShell>
    );
  const event = data.data;
  return (
    <EventDetail
      event={{
        ...event,
        description: event.description ?? "",
        categoryName: event.category.name,
        organizerName: event.organizer.name,
        applicationDeadline: event.applicationDeadline ?? null,
        applicationCount: event.confirmedCount,
        seatsLeft: Math.max(0, event.capacity - event.confirmedCount),
      }}
      onChanged={reload}
    />
  );
}
