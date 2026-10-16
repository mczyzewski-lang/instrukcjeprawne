import Link from "next/link";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8.5 C12.5 6.5 8 6 4 6.5 V25 C8 24.5 12.5 25 16 27 C19.5 25 24 24.5 28 25 V6.5 C24 6 19.5 6.5 16 8.5 Z" stroke="currentColor" fill="#fff" />
      <path d="M16 8.5 V27" stroke="currentColor" />
      <path d="M19.5 12.5 H24.5 M19.5 16.5 H23" stroke="var(--color-gold)" />
      <path d="M7.5 12.5 H12.5 M7.5 16.5 H11" stroke="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-navy no-underline">
      <LogoMark />
      <span className="text-[0.95rem] font-extrabold tracking-[0.12em] sm:text-base">
        INSTRUKCJE PRAWNE<span className="text-gold">.</span>
        <span className="sr-only"> – strona główna</span>
      </span>
    </Link>
  );
}
