"use client";

import { useState } from "react";

import type { NotificationSetting } from "../_lib/settings";
import ToggleSwitch from "./ToggleSwitch";

type NotificationSettingsProps = {
  initialSettings: NotificationSetting[];
};

export default function NotificationSettings({
  initialSettings,
}: NotificationSettingsProps) {
  const [settings, setSettings] =
    useState<NotificationSetting[]>(initialSettings);

  // 設定の保存はAPI接続のPRで実装。今は画面内の状態だけを切り替える
  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id
          ? { ...setting, isEnabled: !setting.isEnabled }
          : setting,
      ),
    );
  };

  return (
    <ul className="space-y-5 rounded-xl border border-ol-neutral-primary bg-white p-5">
      {settings.map((setting) => {
        const titleId = `notification-${setting.id}-title`;
        const descriptionId = `notification-${setting.id}-description`;

        return (
          <li
            key={setting.id}
            className="flex items-center justify-between gap-6"
          >
            <div>
              <p
                id={titleId}
                className="text-base font-bold text-fg-neutral-primary"
              >
                {setting.title}
              </p>
              <p
                id={descriptionId}
                className="mt-1 text-xs text-fg-neutral-secondary"
              >
                {setting.description}
              </p>
            </div>
            <ToggleSwitch
              isOn={setting.isEnabled}
              labelledBy={titleId}
              describedBy={descriptionId}
              onToggle={() => handleToggle(setting.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
