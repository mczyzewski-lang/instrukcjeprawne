export function StepNumber({ n, size = "lg" }: { n: number; size?: "sm" | "md" | "lg" | "xl" }) {
  const cls = { sm: "text-2xl", md: "text-4xl", lg: "text-5xl sm:text-6xl", xl: "text-6xl sm:text-7xl" }[size];
  return (
    <span className={`step-number ${cls}`} aria-hidden="true">
      {String(n).padStart(2, "0")}
    </span>
  );
}
