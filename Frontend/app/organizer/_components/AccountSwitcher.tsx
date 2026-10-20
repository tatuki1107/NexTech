"use client";

import { useState } from "react";

type Account = {
  id: string;
  name: string;
  role: string;
};

// 仮データ。アカウント取得APIができたら置き換える
const accounts: Account[] = [
  { id: "yamada", name: "山田 太郎", role: "主催者アカウント" },
  { id: "sato", name: "佐藤 二郎", role: "主催者アカウント" },
  { id: "suzuki", name: "鈴木 花子", role: "主催者アカウント" },
];

function AccountInfo({ account }: { account: Account }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="h-12 w-12 shrink-0 rounded-full bg-[#DEDEDE]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{account.name}</p>
        <p className="truncate text-xs">{account.role}</p>
      </div>
    </>
  );
}

export default function AccountSwitcher() {
  const [currentId, setCurrentId] = useState(accounts[0].id);
  const [isOpen, setIsOpen] = useState(false);

  const currentAccount =
    accounts.find((account) => account.id === currentId) ?? accounts[0];
  const otherAccounts = accounts.filter((account) => account.id !== currentId);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (id: string) => {
    setCurrentId(id);
    setIsOpen(false);
  };

  return (
    <div className="relative -mx-4 border-t border-ol-neutral-primary/20">
      <ul
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`absolute bottom-full left-0 w-full bg-[#0C2A7A] transition-all duration-200 ease-out ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {otherAccounts.map((account) => (
          <li key={account.id}>
            <button
              type="button"
              onClick={() => handleSelect(account.id)}
              className="flex w-full items-center gap-4 px-7 py-4 text-left hover:bg-[#1A3CA8]"
            >
              <AccountInfo account={account} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={handleToggle}
        className="flex w-full items-center gap-4 px-7 py-6 text-left"
      >
        <AccountInfo account={currentAccount} />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}