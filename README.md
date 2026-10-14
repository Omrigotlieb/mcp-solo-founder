# mcp-solo-founder

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Run your one-person company from Claude Code (or any MCP client).** Weekly plans, a markdown CRM, investor update drafts and launch checklists. Everything is plain markdown on your disk. No accounts, no API keys, no cloud.

## Install (one line)

```bash
claude mcp add solo-founder -- npx -y github:Omrigotlieb/mcp-solo-founder
```

Data goes to `./.solo-founder/` by default. To keep one company folder:

```bash
claude mcp add solo-founder -e SOLO_FOUNDER_DIR=$HOME/company -- npx -y github:Omrigotlieb/mcp-solo-founder
```

Other clients (Cursor, Claude Desktop, etc.):

```json
{ "mcpServers": { "solo-founder": { "command": "npx", "args": ["-y", "github:Omrigotlieb/mcp-solo-founder"] } } }
```

## Demo

```text
You:    Plan my week. Goals: ship onboarding v2, talk to 5 users, send October investor update.
Claude: → weekly_plan  Saved .solo-founder/weekly/2026-W42.md

You:    Dana from Acme wants a call Thursday. Add her.
Claude: → pipeline_upsert {name: "Dana", company: "Acme", stage: "call", nextStep: "Thu call"}

You:    Draft the investor update. MRR $2.1k (was $1.4k), 38 users.
Claude: → investor_update  Draft saved .solo-founder/investor-updates/oct-2026.md (not sent)
```

Resulting files:

```text
.solo-founder/
├── weekly/2026-W42.md
├── pipeline/dana.md
├── investor-updates/oct-2026.md
└── launches/onboarding-v2.md
```

## Tools

| Tool | What it does |
|---|---|
| `weekly_plan` | Up to 5 goals + Friday review section, saved per ISO week |
| `pipeline_upsert` | Add/update a contact (lead → contacted → call → proposal → won/lost), appends to its log |
| `pipeline_list` | Whole pipeline ordered by stage |
| `investor_update` | TL;DR, metrics table with previous values, wins, challenges, asks. Saved as a draft, never sent |
| `launch_checklist` | 10 must-dos for launch day, plus your own items |

## Skills

Agent skills in [`skills/`](skills) that use the tools: `weekly-plan`, `pipeline-review`, `investor-update`, `launch-checklist`. For Claude Code, copy them into `~/.claude/skills/`:

```bash
git clone https://github.com/Omrigotlieb/mcp-solo-founder && cp -r mcp-solo-founder/skills/* ~/.claude/skills/
```

## Develop

```bash
npm install && npm run build && npm test
```

## Related

- [ai-skills](https://github.com/Omrigotlieb/ai-skills): CLAUDE.md and skill templates
- [awesome-anthropic](https://github.com/Omrigotlieb/awesome-anthropic)

Built by [Omri Gotlieb](https://github.com/Omrigotlieb). Want this without the terminal? **[Guti AI](https://gutiailabs.com)** is a calm AI workspace for solo founders.

MIT licensed.

> CI workflow is in `ci/github-actions-ci.yml`; move it to `.github/workflows/ci.yml` to enable GitHub Actions.
