import EventForm from "../../_components/EventForm";
import type { EventFormValues } from "../../_lib/event-form";

// 仮データ。APIができたら、URLのidで取得したイベントに置き換える
const SAMPLE_VALUES: EventFormValues = {
  title: "React UI設計ワークショップ",
  date: "2026-06-14",
  startTime: "13:00",
  endTime: "16:00",
  venue: "名古屋",
  venueUrl: "",
  capacity: "40",
  tags: ["フロントエンド", "生成AI"],
  description: "Reactを使ったUI設計の考え方を、ハンズオンで学びます。",
};

export default function EditEventPage() {
  return (
    <EventForm
      mode="edit"
      initialValues={SAMPLE_VALUES}
      lastUpdated="2026/05/01 17:30　山田太郎"
    />
  );
}