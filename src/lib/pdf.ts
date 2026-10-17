import "server-only";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import SVGtoPDF from "svg-to-pdfkit";
import { renderIllustrationSvg } from "@/illustrations/library";
import { formatPlDate, type Plan, type PlanItem } from "./plan";
import { PATH_KIND_LABEL, type Instruction, type Path } from "./types";

/**
 * Generator PDF w stylu minimalistycznej drukowanej instrukcji:
 * duże numery stron i kroków, granatowe rysunki, białe tło, checklisty, schemat decyzji,
 * źródła z datą weryfikacji oraz kod QR do aktualnej wersji online.
 */

const NAVY = "#14233E";
const GOLD = "#B79556";
const MUTED = "#647080";
const LINE = "#E5E7EB";
const URGENT = "#9A2C1F";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const M = 48; // margines
const W = 595.28;
const H = 841.89;
const CW = W - 2 * M; // szerokość treści
const BOTTOM = H - 80; // dolna granica treści (miejsce na numer strony)

type Doc = PDFKit.PDFDocument;

function setup(title: string): Doc {
  const doc = new PDFDocument({ size: "A4", margins: { top: M, bottom: 40, left: M, right: M }, bufferPages: true, info: { Title: title, Author: "InstrukcjePrawne.pl", Subject: title }, lang: "pl-PL" } as PDFKit.PDFDocumentOptions);
  doc.registerFont("R", path.join(FONT_DIR, "Manrope_400Regular.ttf"));
  doc.registerFont("B", path.join(FONT_DIR, "Manrope_700Bold.ttf"));
  doc.registerFont("X", path.join(FONT_DIR, "Manrope_800ExtraBold.ttf"));
  doc.font("R").fillColor(NAVY);
  return doc;
}

function ensure(doc: Doc, height: number) {
  if (doc.y + height > BOTTOM) {
    doc.addPage();
    doc.y = M;
  }
}

function illustration(doc: Doc, id: string, x: number, y: number, width: number) {
  const svg = renderIllustrationSvg(id, { ink: NAVY, accent: GOLD, paper: "#FFFFFF" });
  SVGtoPDF(doc, svg, x, y, { width, height: (width * 120) / 160, preserveAspectRatio: "xMidYMid meet" });
}

function rule(doc: Doc, y = doc.y) {
  doc.save().moveTo(M, y).lineTo(W - M, y).lineWidth(0.8).strokeColor(LINE).stroke().restore();
}

function sectionTitle(doc: Doc, letter: string, title: string, lead?: string) {
  ensure(doc, 90);
  doc.moveDown(0.6);
  const y = doc.y;
  doc.save().rect(M, y, 30, 30).lineWidth(1.6).strokeColor(NAVY).stroke().restore();
  doc.font("X").fontSize(15).fillColor(NAVY).text(letter, M, y + 7, { width: 30, align: "center" });
  doc.font("X").fontSize(19).text(title, M + 44, y + 3, { width: CW - 44 });
  if (lead) doc.font("R").fontSize(10).fillColor(MUTED).text(lead, M + 44, doc.y + 2, { width: CW - 44 });
  doc.fillColor(NAVY);
  doc.y = Math.max(doc.y, y + 34) + 10;
  doc.x = M;
}

function bullets(doc: Doc, items: string[], opts: { x?: number; width?: number; size?: number; color?: string } = {}) {
  const x = opts.x ?? M;
  const width = opts.width ?? CW;
  const size = opts.size ?? 10;
  for (const t of items) {
    const h = doc.font("R").fontSize(size).heightOfString(t, { width: width - 14 });
    ensure(doc, h + 4);
    const y = doc.y;
    doc.save().moveTo(x, y + size * 0.65).lineTo(x + 7, y + size * 0.65).lineWidth(1.6).strokeColor(GOLD).stroke().restore();
    doc.fillColor(opts.color ?? NAVY).text(t, x + 14, y, { width: width - 14 });
    doc.moveDown(0.2);
  }
  doc.x = M;
}

function checkbox(doc: Doc, label: string, checked: boolean) {
  const h = doc.font("R").fontSize(11).heightOfString(label, { width: CW - 30 });
  ensure(doc, Math.max(h, 16) + 8);
  const y = doc.y;
  doc.save().rect(M, y, 13, 13).lineWidth(1.2).strokeColor(NAVY).stroke().restore();
  if (checked) doc.save().moveTo(M + 2.5, y + 7).lineTo(M + 5.5, y + 10.5).lineTo(M + 11, y + 2.5).lineWidth(2).strokeColor(GOLD).stroke().restore();
  doc.fillColor(NAVY).text(label, M + 24, y, { width: CW - 30 });
  doc.y = Math.max(doc.y, y + 16) + 6;
  doc.x = M;
}

async function qr(doc: Doc, url: string, x: number, y: number, size: number) {
  const q = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = q.modules.size;
  const cell = size / n;
  doc.save().fillColor(NAVY);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.modules.get(r, c)) doc.rect(x + c * cell, y + r * cell, cell + 0.05, cell + 0.05).fill();
  doc.restore();
}

function pageNumbers(doc: Doc, footer: string) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // stopka leży poniżej marginesu – bez tego pdfkit dodałby nową stronę
    doc.page.margins.bottom = 0;
    const n = String(i + 1).padStart(2, "0");
    doc.save();
    doc.font("X").fontSize(30).fillColor(NAVY).text(n, W - M - 80, H - 66, { width: 80, align: "right", lineBreak: false });
    doc.moveTo(W - M - 26, H - 30).lineTo(W - M, H - 30).lineWidth(2.5).strokeColor(GOLD).stroke();
    doc.font("R").fontSize(7.5).fillColor(MUTED).text(footer, M, H - 52, { width: CW - 100, lineBreak: true });
    doc.restore();
  }
}

const fmt = (d: string | null | undefined) => (d ? d.split("-").reverse().join(".") : "");

function toBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function pathSteps(doc: Doc, p: Path) {
  ensure(doc, 190);
  doc.moveDown(0.5);
  doc.font("B").fontSize(8.5).fillColor(MUTED).text(PATH_KIND_LABEL[p.kind].toUpperCase(), { characterSpacing: 1.2 });
  doc.font("X").fontSize(16).fillColor(NAVY).text(p.name);
  doc.font("R").fontSize(10).fillColor(MUTED).text(p.summary, { width: CW });
  doc.fillColor(NAVY).moveDown(0.6);
  for (const s of p.steps) {
    const textW = CW - 64 - 120;
    const body = doc.font("R").fontSize(10).heightOfString(s.explanation, { width: textW });
    const title = doc.font("B").fontSize(12.5).heightOfString(s.title, { width: textW });
    const blockH = Math.max(title + body + 20 + (s.warning ? 30 : 0), 96);
    ensure(doc, blockH + 10);
    rule(doc);
    const y = doc.y + 10;
    doc.font("X").fontSize(30).fillColor(NAVY).text(String(s.number).padStart(2, "0"), M, y - 2, { width: 60 });
    doc.save().moveTo(M, y + 34).lineTo(M + 30, y + 34).lineWidth(2.5).strokeColor(GOLD).stroke().restore();
    doc.font("B").fontSize(12.5).fillColor(NAVY).text(s.title, M + 64, y, { width: textW });
    doc.font("R").fontSize(10).text(s.explanation, M + 64, doc.y + 3, { width: textW });
    if (s.warning) {
      doc.moveDown(0.3);
      doc.font("B").fontSize(9).fillColor(URGENT).text(`Uwaga: ${s.warning}`, M + 64, doc.y, { width: textW });
      doc.fillColor(NAVY);
    }
    const endText = doc.y;
    illustration(doc, s.illustration, W - M - 110, y, 110);
    doc.y = Math.max(endText, y + 84) + 8;
    doc.x = M;
  }
}

export async function instructionPdf(ins: Instruction, opts: { url: string; reviewed: boolean }): Promise<Buffer> {
  const doc = setup(ins.title);

  // Okładka
  doc.font("X").fontSize(11).fillColor(NAVY).text("INSTRUKCJE PRAWNE", M, M, { characterSpacing: 1.6, continued: true }).fillColor(GOLD).text(".");
  doc.moveDown(3);
  doc.font("X").fontSize(30).fillColor(NAVY).text(ins.title, { width: CW, lineGap: -2 });
  doc.moveDown(0.5);
  doc.font("R").fontSize(13).fillColor(MUTED).text(ins.subtitle, { width: CW - 60 });
  illustration(doc, ins.illustration, M + CW / 2 - 140, doc.y + 30, 280);
  doc.y += 250;
  doc.fillColor(NAVY).font("B").fontSize(10);
  doc.text(`Stan prawny na dzień: ${fmt(ins.researchedAt)}`);
  doc.text(opts.reviewed && ins.legalReviewedAt ? `Weryfikacja przez prawnika: ${fmt(ins.legalReviewedAt)}` : "Weryfikacja przez prawnika: oczekuje (wersja robocza)");
  doc.moveDown(1);
  const qy = doc.y;
  await qr(doc, opts.url, M, qy, 78);
  doc.font("B").fontSize(10).text("Aktualna wersja online:", M + 92, qy + 14, { width: CW - 92 });
  doc.font("R").fontSize(10).fillColor(MUTED).text(opts.url, M + 92, doc.y + 2, { width: CW - 92, link: opts.url });
  doc.fillColor(NAVY);
  doc.y = qy + 96;
  doc.font("R").fontSize(8.5).fillColor(MUTED).text(
    "Informacje ogólne, nie indywidualna opinia prawna. Przepisy mogą się zmieniać – przed działaniem sprawdź aktualną wersję online i wskazane źródła.",
    { width: CW },
  );

  // Pilne
  doc.addPage();
  doc.y = M;
  if (ins.urgent) {
    const items = ins.urgent.items;
    const textH = items.reduce((h, t) => h + doc.font("R").fontSize(10.5).heightOfString(t, { width: CW - 40 }) + 5, 0);
    const y = doc.y;
    doc.save().rect(M, y, 4, textH + 36).fill(URGENT).restore();
    doc.font("X").fontSize(13).fillColor(NAVY).text(ins.urgent.title, M + 16, y + 4, { width: CW - 20 });
    doc.moveDown(0.3);
    bullets(doc, items, { x: M + 16, width: CW - 20, size: 10.5 });
    doc.y = Math.max(doc.y, y + textH + 36) + 10;
  }

  // A
  sectionTitle(doc, "A", "Zrozum swoją sytuację", "Pytania orientacyjne – nie są diagnozą prawną.");
  ins.situationQuestions.forEach((q, i) => {
    const h = doc.font("R").fontSize(9.5).heightOfString(q.ifYes + q.ifNo, { width: CW - 40 }) + 40;
    ensure(doc, h);
    doc.font("B").fontSize(11).fillColor(NAVY).text(`${String(i + 1).padStart(2, "0")}   ${q.question}`, M, doc.y, { width: CW });
    doc.font("R").fontSize(9.5).text(`Tak → ${q.ifYes}`, M + 26, doc.y + 2, { width: CW - 26 });
    doc.fillColor(MUTED).text(`Nie → ${q.ifNo}`, M + 26, doc.y + 1, { width: CW - 26 });
    doc.fillColor(NAVY).moveDown(0.6);
    doc.x = M;
  });

  // B – schemat decyzji i drogi
  sectionTitle(doc, "B", "Poznaj możliwe drogi", "Schemat pytań i możliwe drogi. Wynik to orientacja, nie ocena prawna.");
  const outcomeTitle = new Map(ins.decisionTree.outcomes.map((o) => [o.id, o.title]));
  const nodeIndex = new Map(ins.decisionTree.nodes.map((n, i) => [n.id, i + 1]));
  for (const n of ins.decisionTree.nodes) {
    ensure(doc, 30 + n.options.length * 16);
    doc.font("B").fontSize(11).fillColor(NAVY).text(`P${nodeIndex.get(n.id)}  ${n.question}`, M, doc.y, { width: CW });
    for (const o of n.options) {
      const target = [
        ...(o.outcomeIds ?? []).map((id) => `„${outcomeTitle.get(id)}”`),
        o.nextNodeId ? `dalej: P${nodeIndex.get(o.nextNodeId)}` : "koniec",
      ].join(" · ");
      const line = `${o.label}  →  ${target}`;
      ensure(doc, doc.font("R").fontSize(9.5).heightOfString(line, { width: CW - 30 }) + 4);
      const oy = doc.y + 1;
      doc.save().circle(M + 21, oy + 5.5, 2.6).lineWidth(1).strokeColor(NAVY).stroke().restore();
      doc.font("R").fontSize(9.5).fillColor(NAVY).text(line, M + 30, oy, { width: CW - 30 });
    }
    doc.moveDown(0.6);
    doc.x = M;
  }
  ins.paths.forEach((p, idx) => {
    ensure(doc, 130);
    rule(doc);
    doc.moveDown(0.5);
    doc.font("X").fontSize(13).fillColor(NAVY).text(`${String(idx + 1).padStart(2, "0")}  ${p.name}`, M, doc.y, { width: CW });
    doc.font("R").fontSize(9.5).fillColor(MUTED).text(p.summary, { width: CW });
    doc.fillColor(NAVY).moveDown(0.3);
    const rows: [string, string[]][] = [
      ["Dla kogo", p.whenApplicable],
      ["Kiedy raczej nie", p.whenNotApplicable],
      ["Co można zyskać", p.benefits],
      ["Ryzyka", p.risks],
      ["Koszty", p.costs],
      ["Warunki", p.requirements],
    ];
    for (const [label, items] of rows) {
      if (!items.length) continue;
      ensure(doc, 28);
      doc.font("B").fontSize(9.5).fillColor(label === "Ryzyka" ? URGENT : NAVY).text(label, M, doc.y + 2);
      bullets(doc, items, { size: 9.5 });
    }
    ensure(doc, 30);
    doc.font("B").fontSize(9.5).fillColor(NAVY).text("Pierwszy krok: ", M, doc.y + 2, { continued: true }).font("R").text(p.firstStep, { width: CW });
    doc.moveDown(0.5);
  });

  // C – kroki
  doc.addPage();
  doc.y = M;
  sectionTitle(doc, "C", "Instrukcja krok po kroku");
  ins.paths.forEach((p) => pathSteps(doc, p));

  // D – checklisty
  sectionTitle(doc, "D", "Co przygotować?", "Odhaczaj to, co już masz.");
  for (const p of ins.paths) {
    if (!p.documents.length) continue;
    ensure(doc, 60);
    doc.font("B").fontSize(11.5).fillColor(NAVY).text(p.name, M, doc.y + 4);
    doc.moveDown(0.4);
    for (const d of p.documents) checkbox(doc, d.label, false);
    doc.moveDown(0.4);
  }

  // E – ostrzeżenia
  sectionTitle(doc, "E", "Na co uważać?");
  for (const w of ins.warnings) {
    const h = doc.font("R").fontSize(10).heightOfString(w.body, { width: CW - 16 }) + 26;
    ensure(doc, h);
    const y = doc.y;
    doc.save().rect(M, y, 3, h - 6).fill(w.severity === "urgent" ? URGENT : GOLD).restore();
    doc.font("B").fontSize(11).fillColor(NAVY).text(w.title, M + 14, y, { width: CW - 16 });
    doc.font("R").fontSize(10).text(w.body, M + 14, doc.y + 1, { width: CW - 16 });
    doc.y = Math.max(doc.y, y + h - 6) + 8;
    doc.x = M;
  }

  // F – pomoc
  sectionTitle(doc, "F", "Gdzie szukać pomocy");
  for (const h of ins.freeHelp) {
    ensure(doc, 44);
    doc.font("B").fontSize(11).fillColor(NAVY).text(h.name, M, doc.y);
    doc.font("R").fontSize(9.5).text([h.description, h.phone, h.url].filter(Boolean).join(" · "), { width: CW });
    doc.moveDown(0.5);
  }
  if (ins.leadTopic) {
    ensure(doc, 40);
    doc.font("R").fontSize(9.5).fillColor(MUTED).text(
      "Możesz też bezpłatnie porozmawiać z ekspertem przez formularz na stronie instrukcji. Rozmowę może prowadzić współpracujący z portalem podmiot komercyjny, a dalsza pomoc może być odpłatna.",
      { width: CW },
    );
    doc.fillColor(NAVY);
  }

  // Źródła
  doc.addPage();
  doc.y = M;
  doc.font("X").fontSize(19).fillColor(NAVY).text("Źródła i stan prawny");
  doc.moveDown(0.4);
  doc.font("R").fontSize(9.5).text(ins.legalStatusNote, { width: CW });
  doc.moveDown(0.6);
  ins.sourceReferences.forEach((s, i) => {
    const line = `${s.title} – ${s.publisher}`;
    const meta = `${s.url}\nSprawdzono: ${fmt(s.verifiedAt)}${s.publishedOrUpdated ? ` · dokument: ${fmt(s.publishedOrUpdated)}` : ""} · ${s.confidence === "verified" ? "potwierdzone" : s.confidence === "partial" ? "potwierdzone częściowo" : "do weryfikacji"}${s.note ? `\n${s.note}` : ""}`;
    const h = doc.font("R").fontSize(9).heightOfString(line + meta, { width: CW - 26 }) + 14;
    ensure(doc, h);
    const y = doc.y;
    doc.font("X").fontSize(9).fillColor(MUTED).text(`[${i + 1}]`, M, y, { width: 24 });
    doc.font("B").fontSize(9).fillColor(NAVY).text(line, M + 26, y, { width: CW - 26 });
    doc.font("R").fontSize(8).fillColor(MUTED).text(meta, M + 26, doc.y, { width: CW - 26 });
    doc.fillColor(NAVY).moveDown(0.5);
    doc.x = M;
  });
  if (ins.pendingVerification.length) {
    ensure(doc, 50);
    doc.moveDown(0.4);
    doc.font("B").fontSize(10.5).text("Czego jeszcze nie potwierdziliśmy");
    bullets(doc, ins.pendingVerification, { size: 9 });
  }

  pageNumbers(doc, `InstrukcjePrawne.pl · ${ins.title} · stan prawny ${fmt(ins.researchedAt)} · ${opts.url}`);
  return toBuffer(doc);
}

export async function checklistPdf(ins: Instruction, p: Path, checked: string[], opts: { url: string }): Promise<Buffer> {
  const doc = setup(`Co przygotować – ${p.name}`);
  doc.font("X").fontSize(11).fillColor(NAVY).text("INSTRUKCJE PRAWNE", M, M, { characterSpacing: 1.6, continued: true }).fillColor(GOLD).text(".");
  doc.moveDown(2);
  doc.font("B").fontSize(10).fillColor(MUTED).text(ins.title);
  doc.font("X").fontSize(24).fillColor(NAVY).text("Co przygotować?");
  doc.font("R").fontSize(12).fillColor(MUTED).text(`Droga: ${p.name}`);
  illustration(doc, "checklist", W - M - 120, M + 30, 120);
  doc.fillColor(NAVY).moveDown(1.5);
  doc.y = Math.max(doc.y, M + 130);
  for (const d of p.documents) checkbox(doc, d.label, checked.includes(d.id));
  doc.moveDown(1);
  ensure(doc, 70);
  doc.font("B").fontSize(11).text("Pierwszy krok");
  doc.font("R").fontSize(10.5).text(p.firstStep, { width: CW });
  doc.moveDown(1.2);
  ensure(doc, 100);
  const y = doc.y;
  await qr(doc, opts.url, M, y, 72);
  doc.font("B").fontSize(10).text("Cała instrukcja online:", M + 86, y + 14, { width: CW - 86 });
  doc.font("R").fontSize(9.5).fillColor(MUTED).text(opts.url, M + 86, doc.y + 2, { width: CW - 86 });
  pageNumbers(doc, `InstrukcjePrawne.pl · lista dokumentów · stan prawny ${fmt(ins.researchedAt)}`);
  return toBuffer(doc);
}

/** Pozycja planu: kwadrat do odhaczenia, tytuł i (opcjonalnie) krótkie wyjaśnienie. */
function planItem(doc: Doc, it: PlanItem) {
  const tw = CW - 26;
  const lh = doc.font("B").fontSize(10.5).heightOfString(it.label, { width: tw - (it.due ? 50 : 0) });
  const dh = it.detail ? doc.font("R").fontSize(9).heightOfString(it.detail, { width: tw }) + 2 : 0;
  ensure(doc, lh + dh + 10);
  const y = doc.y;
  doc.save().rect(M, y + 1, 12, 12).lineWidth(1.2).strokeColor(it.urgent ? URGENT : NAVY).stroke().restore();
  if (it.done) doc.save().moveTo(M + 2.5, y + 7.5).lineTo(M + 5.2, y + 10.5).lineTo(M + 10.5, y + 3).lineWidth(2).strokeColor(GOLD).stroke().restore();
  if (it.due) doc.font("B").fontSize(9).fillColor(it.urgent ? URGENT : MUTED).text(formatPlDate(it.due).slice(0, 5), W - M - 44, y + 1, { width: 44, align: "right" });
  doc.font("B").fontSize(10.5).fillColor(it.urgent ? URGENT : NAVY).text(it.label, M + 22, y, { width: tw - (it.due ? 50 : 0) });
  if (it.detail) doc.font("R").fontSize(9).fillColor(MUTED).text(it.detail, M + 22, doc.y + 1, { width: tw });
  doc.y += 8;
  doc.x = M;
}

/** „Plan …” – osobista checklista na podstawie odpowiedzi. */
export async function planPdf(ins: Instruction, plan: Plan, opts: { url: string; planUrl: string }): Promise<Buffer> {
  const doc = setup(`${plan.title} – ${ins.title}`);
  doc.font("X").fontSize(11).fillColor(NAVY).text("INSTRUKCJE PRAWNE", M, M, { characterSpacing: 1.6, continued: true }).fillColor(GOLD).text(".");
  doc.moveDown(2);
  doc.font("B").fontSize(10).fillColor(MUTED).text(ins.title, { width: CW - 140 });
  doc.font("X").fontSize(26).fillColor(NAVY).text(plan.heading, { width: CW - 140 });
  doc.font("R").fontSize(10.5).fillColor(MUTED).text(`Droga: ${plan.pathName} · ${formatPlDate(plan.startDate)} – ${formatPlDate(plan.endDate)} · ${plan.doneCount} z ${plan.total} zrobione`, { width: CW - 140 });
  if (plan.deadline) doc.font("B").fillColor(URGENT).text(`Termin w sprawie: ${formatPlDate(plan.deadline.date)}`, { width: CW - 140 });
  illustration(doc, "checklist", W - M - 120, M + 26, 120);
  doc.y = Math.max(doc.y + 14, M + 150);

  // cel
  const gh = doc.font("X").fontSize(13).heightOfString(plan.goal, { width: CW - 32 });
  ensure(doc, gh + 40);
  const gy = doc.y;
  doc.save().rect(M, gy, CW, gh + 34).fill(NAVY).restore();
  doc.font("B").fontSize(8.5).fillColor("#FFFFFF").text("TWÓJ CEL", M + 16, gy + 10, { characterSpacing: 1.2 });
  doc.font("X").fontSize(13).text(plan.goal, M + 16, doc.y + 2, { width: CW - 32 });
  doc.y = gy + gh + 46;
  doc.x = M;

  sectionTitle(doc, "A", "Gdzie jesteś teraz");
  bullets(doc, plan.now, { size: 10 });
  doc.moveDown(0.4);
  if (plan.gains.length) {
    ensure(doc, 30);
    doc.font("B").fontSize(10).fillColor(NAVY).text("Co jeszcze zyskasz", M, doc.y);
    bullets(doc, plan.gains, { size: 10 });
  }
  ensure(doc, 40);
  doc.font("B").fontSize(10).fillColor(NAVY).text("Dlaczego ta droga: ", M, doc.y + 4, { continued: true, width: CW }).font("R").text(plan.reason);
  if (plan.costOfWaiting.length) {
    doc.moveDown(0.6);
    ensure(doc, 30);
    doc.font("B").fontSize(10).fillColor(URGENT).text("Ile kosztuje zwlekanie", M, doc.y);
    bullets(doc, plan.costOfWaiting, { size: 9.5 });
  }
  doc.moveDown(1);

  plan.sections.forEach((s, i) => {
    ensure(doc, 80);
    sectionTitle(doc, String(i + 1), s.kicker ? `${s.kicker}: ${s.title}` : s.title, s.why);
    for (const it of s.items) planItem(doc, it);
    doc.moveDown(0.8);
  });

  // co dalej
  ensure(doc, 140);
  sectionTitle(doc, "?", "Jak chcesz działać dalej?", "Plan jest Twój bez względu na wybór.");
  bullets(doc, [
    "Samodzielnie – odhaczaj zadania z tego planu, zaczynając od etapu 1.",
    `Z ekspertem – omów plan bezpłatnie na ${opts.url} (sekcja „Potrzebujesz pomocy?”). Pierwsza rozmowa do niczego nie zobowiązuje.`,
  ], { size: 10 });
  doc.moveDown(1);

  ensure(doc, 110);
  const y = doc.y + 6;
  await qr(doc, opts.planUrl, M, y, 72);
  doc.font("B").fontSize(10).fillColor(NAVY).text("Ten plan online (z Twoimi odpowiedziami):", M + 86, y + 6, { width: CW - 86 });
  doc.font("R").fontSize(9).fillColor(MUTED).text(opts.url, M + 86, doc.y + 2, { width: CW - 86 });
  doc.font("R").fontSize(8.5).fillColor(MUTED).text(
    "Plan powstał automatycznie z odpowiedzi w instrukcji. Daty są propozycją. To informacja ogólna, nie ocena prawna Twojej sprawy.",
    M + 86,
    doc.y + 8,
    { width: CW - 86 },
  );
  pageNumbers(doc, `InstrukcjePrawne.pl · ${plan.title} · stan prawny ${fmt(ins.researchedAt)}`);
  return toBuffer(doc);
}
