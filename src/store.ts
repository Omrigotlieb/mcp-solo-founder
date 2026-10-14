import { promises as fs } from "node:fs";
import path from "node:path";

export function dataDir(): string {
  return path.resolve(process.env.SOLO_FOUNDER_DIR ?? path.join(process.cwd(), ".solo-founder"));
}

function safe(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("Name must contain letters or numbers");
  return slug;
}

export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const wk = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(wk).padStart(2, "0")}`;
}

async function write(rel: string, content: string): Promise<string> {
  const file = path.join(dataDir(), rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
  return file;
}
async function read(rel: string): Promise<string | null> {
  try { return await fs.readFile(path.join(dataDir(), rel), "utf8"); } catch { return null; }
}

export async function weeklyPlan(goals: string[], focus?: string, week = isoWeek()) {
  const md = `# Weekly plan ${week}\n\n${focus ? `**Focus:** ${focus}\n\n` : ""}## Top goals\n${goals
    .map((g) => `- [ ] ${g}`).join("\n")}\n\n## Review (fill Friday)\n- Shipped:\n- Learned:\n- Next week:\n`;
  return { file: await write(`weekly/${week}.md`, md), markdown: md };
}

export interface Contact { name: string; company?: string; stage: string; note?: string; nextStep?: string; }
const STAGES = ["lead", "contacted", "call", "proposal", "won", "lost"] as const;
export { STAGES };

export async function pipelineUpsert(c: Contact, today = new Date().toISOString().slice(0, 10)) {
  const rel = `pipeline/${safe(c.name)}.md`;
  const prev = await read(rel);
  const log = prev?.split("## Log\n")[1] ?? "";
  const entry = `- ${today} [${c.stage}] ${c.note ?? "updated"}\n`;
  const md = `# ${c.name}\n\n- Company: ${c.company ?? "-"}\n- Stage: ${c.stage}\n- Next step: ${c.nextStep ?? "-"}\n\n## Log\n${log}${entry}`;
  return { file: await write(rel, md), markdown: md };
}

export async function pipelineList() {
  const dir = path.join(dataDir(), "pipeline");
  let files: string[] = [];
  try { files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")); } catch { /* empty */ }
  const rows = await Promise.all(files.map(async (f) => {
    const t = await fs.readFile(path.join(dir, f), "utf8");
    const g = (k: string) => t.match(new RegExp(`- ${k}: (.*)`))?.[1] ?? "-";
    return { name: t.split("\n")[0].replace(/^# /, ""), company: g("Company"), stage: g("Stage"), nextStep: g("Next step") };
  }));
  return rows.sort((a, b) => STAGES.indexOf(a.stage as never) - STAGES.indexOf(b.stage as never));
}

export interface Metric { name: string; value: string; previous?: string; }
export async function investorUpdate(o: { company: string; month: string; metrics: Metric[]; wins: string[]; challenges: string[]; asks: string[] }) {
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : "- (none)");
  const md = `# ${o.company} investor update: ${o.month}\n\n**TL;DR:** ${o.wins[0] ?? "Steady progress"}.\n\n## Metrics\n| Metric | Now | Prev |\n|---|---|---|\n${o.metrics
    .map((m) => `| ${m.name} | ${m.value} | ${m.previous ?? "-"} |`).join("\n")}\n\n## Wins\n${list(o.wins)}\n\n## Challenges\n${list(o.challenges)}\n\n## Asks\n${list(o.asks)}\n\nThanks for the support!\n`;
  return { file: await write(`investor-updates/${safe(o.month)}.md`, md), markdown: md };
}

export const LAUNCH_ITEMS = [
  "Landing page with one clear CTA", "Analytics + signup tracking", "Demo GIF / 60s video",
  "Pricing page (even if free)", "Onboarding email", "Product Hunt / Show HN draft",
  "X + LinkedIn launch posts", "Reply plan for launch day comments", "Feedback channel (email/Discord)", "Post-launch metrics review date",
];
export async function launchChecklist(product: string, date: string, extra: string[] = []) {
  const md = `# Launch: ${product} (${date})\n\n${[...LAUNCH_ITEMS, ...extra].map((i) => `- [ ] ${i}`).join("\n")}\n`;
  return { file: await write(`launches/${safe(product)}.md`, md), markdown: md };
}
