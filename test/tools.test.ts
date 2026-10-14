import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";
import * as s from "../src/store.js";

let dir: string;
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), "sf-")); process.env.SOLO_FOUNDER_DIR = dir; });

describe("store", () => {
  it("iso week", () => expect(s.isoWeek(new Date(2026, 9, 14))).toBe("2026-W42"));
  it("weekly plan", async () => {
    const r = await s.weeklyPlan(["Ship v1"], "Launch", "2026-W42");
    expect(readFileSync(r.file, "utf8")).toContain("- [ ] Ship v1");
  });
  it("pipeline upsert keeps log and lists by stage", async () => {
    await s.pipelineUpsert({ name: "Dana Cohen", stage: "lead", note: "met at meetup" }, "2026-10-01");
    const r = await s.pipelineUpsert({ name: "Dana Cohen", stage: "call", nextStep: "send deck" }, "2026-10-14");
    expect(r.markdown).toContain("met at meetup");
    expect(r.markdown).toContain("[call]");
    await s.pipelineUpsert({ name: "Acme", stage: "won" });
    expect((await s.pipelineList()).map((x) => x.name)).toEqual(["Dana Cohen", "Acme"]);
  });
  it("rejects path traversal names", async () => {
    const r = await s.pipelineUpsert({ name: "../../etc", stage: "lead" });
    expect(r.file.startsWith(dir)).toBe(true);
  });
  it("investor update + launch", async () => {
    const u = await s.investorUpdate({ company: "Guti", month: "Oct 2026", metrics: [{ name: "MRR", value: "$2k", previous: "$1k" }], wins: ["First 10 customers"], challenges: [], asks: ["Intros"] });
    expect(u.markdown).toContain("| MRR | $2k | $1k |");
    const l = await s.launchChecklist("My App", "2026-11-01");
    expect(existsSync(l.file)).toBe(true);
  });
});

describe("mcp server", () => {
  it("lists and calls tools", async () => {
    const [a, b] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "t", version: "1" });
    await Promise.all([createServer().connect(a), client.connect(b)]);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["investor_update", "launch_checklist", "pipeline_list", "pipeline_upsert", "weekly_plan"]);
    const res: any = await client.callTool({ name: "weekly_plan", arguments: { goals: ["Talk to 5 users"] } });
    expect(res.content[0].text).toContain("Talk to 5 users");
  });
});
