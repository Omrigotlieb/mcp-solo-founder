import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as s from "./store.js";

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

export function createServer(): McpServer {
  const server = new McpServer({ name: "mcp-solo-founder", version: "0.1.0" });

  server.tool("weekly_plan", "Create this week's plan (top goals + Friday review) as markdown.",
    { goals: z.array(z.string()).min(1).max(5), focus: z.string().optional(), week: z.string().optional() },
    async ({ goals, focus, week }) => { const r = await s.weeklyPlan(goals, focus, week); return text(`Saved ${r.file}\n\n${r.markdown}`); });

  server.tool("pipeline_upsert", "Add or update a customer/investor in the local markdown CRM, appending to its log.",
    { name: z.string(), company: z.string().optional(), stage: z.enum(s.STAGES), note: z.string().optional(), nextStep: z.string().optional() },
    async (c) => { const r = await s.pipelineUpsert(c); return text(`Saved ${r.file}\n\n${r.markdown}`); });

  server.tool("pipeline_list", "List everyone in the pipeline, ordered by stage.", {},
    async () => { const rows = await s.pipelineList();
      return text(rows.length ? rows.map((r) => `- ${r.name} (${r.company}) [${r.stage}] next: ${r.nextStep}`).join("\n") : "Pipeline is empty."); });

  server.tool("investor_update", "Draft a monthly investor update (TL;DR, metrics table, wins, challenges, asks).",
    { company: z.string(), month: z.string(), metrics: z.array(z.object({ name: z.string(), value: z.string(), previous: z.string().optional() })),
      wins: z.array(z.string()).default([]), challenges: z.array(z.string()).default([]), asks: z.array(z.string()).default([]) },
    async (o) => { const r = await s.investorUpdate(o); return text(`Draft saved ${r.file} (not sent)\n\n${r.markdown}`); });

  server.tool("launch_checklist", "Create a launch checklist for a product.",
    { product: z.string(), date: z.string(), extra: z.array(z.string()).optional() },
    async ({ product, date, extra }) => { const r = await s.launchChecklist(product, date, extra); return text(`Saved ${r.file}\n\n${r.markdown}`); });

  return server;
}
