"use client";

import { track, type ClientEventName } from "@/lib/analytics-client";

export function TrackedLink({
  href,
  event,
  instructionSlug,
  className,
  children,
}: {
  href: string;
  event: ClientEventName;
  instructionSlug?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={() => track(event, { instructionSlug, props: { source: "header" } })}>
      {children}
    </a>
  );
}
