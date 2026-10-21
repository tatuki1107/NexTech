import Link from "next/link";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  className: string;
};

export default function QuickActionCard({
  title,
  description,
  href,
  className,
}: QuickActionCardProps) {
  return (
    <div className={`rounded-xl p-5 ${className}`}>
      <h3 className="text-base font-bold text-fg-neutral-primary">{title}</h3>
      <p className="mt-3 text-xs text-fg-neutral-secondary">{description}</p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-fg-brand-primary"
      >
        開く
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}