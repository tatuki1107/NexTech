const CARD_BUTTON_BASE =
  "flex h-12 w-28 items-center justify-center rounded-xl border-2 bg-white text-base font-bold";

export const CARD_BUTTON = {
  neutral: `${CARD_BUTTON_BASE} border-fg-neutral-secondary text-fg-neutral-secondary`,
  brand: `${CARD_BUTTON_BASE} border-fg-brand-primary text-fg-brand-primary`,
  success: `${CARD_BUTTON_BASE} border-fg-accent-green text-fg-accent-green`,
  danger: `${CARD_BUTTON_BASE} border-fg-warning-primary text-fg-warning-primary`,
} as const;