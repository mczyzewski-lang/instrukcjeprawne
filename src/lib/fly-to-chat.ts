/**
 * Animacja „plan trafia do czatu”: karta PDF wylatuje z miejsca kliknięcia
 * i ląduje w miejscu załącznika nad formularzem kontaktowym, a potem lekko „osiada”.
 * Bez animacji przy prefers-reduced-motion – załącznik po prostu się pojawia.
 */

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** czeka, aż skończy się płynne przewijanie (scrollend, a gdy go brak – po czasie) */
function afterScroll(maxMs = 900): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", finish);
      resolve();
    };
    window.addEventListener("scrollend", finish, { once: true });
    // jeśli strona się nie przewija (czat już widać), nie czekamy
    let moved = false;
    window.addEventListener("scroll", () => (moved = true), { once: true });
    setTimeout(() => !moved && finish(), 150);
    setTimeout(finish, maxMs);
  });
}

function findTarget(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-attachment-target]"));
  return all.find((el) => el.getClientRects().length > 0) ?? null;
}

export async function flyPlanToChat(from: DOMRect | null, title: string) {
  if (!from || reduceMotion()) return;
  // cel pojawia się po wyrenderowaniu załącznika w czacie
  let target: HTMLElement | null = null;
  for (let i = 0; i < 20 && !target; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    target = findTarget();
  }
  if (!target) return;
  target.style.opacity = "0";
  await afterScroll();
  const to = target.getBoundingClientRect();

  const card = document.createElement("div");
  card.setAttribute("aria-hidden", "true");
  card.className = "pointer-events-none fixed z-[60] flex items-center gap-3 rounded-md border border-line bg-white px-3 py-2.5 shadow-sm";
  card.innerHTML = `<span class="flex h-10 w-8 shrink-0 items-end justify-center rounded-sm border border-navy pb-1 text-[0.55rem] font-extrabold">PDF</span><span class="truncate text-sm font-bold"></span>`;
  (card.lastElementChild as HTMLElement).textContent = `${title}.pdf`;
  Object.assign(card.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
  document.body.appendChild(card);

  // start: środek przycisku, mała karta; koniec: miejsce załącznika
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const anim = card.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.8)`, opacity: 1, offset: 0.45 },
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
    ],
    { duration: 750, easing: "cubic-bezier(.2,.7,.2,1)" },
  );
  await anim.finished.catch(() => undefined);
  card.remove();
  target.style.opacity = "";
  target.animate(
    [
      { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(183,149,86,0.6)" },
      { transform: "scale(1.03)", boxShadow: "0 0 0 6px rgba(183,149,86,0.35)" },
      { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(183,149,86,0)" },
    ],
    { duration: 520, easing: "ease-out" },
  );
}
