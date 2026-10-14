---
name: pipeline-review
description: Review the markdown CRM, update stages, and list concrete next steps.
---

# Pipeline review

1. Call `pipeline_list`.
2. For each contact with no next step or stale for 7+ days, suggest one action.
3. Record changes with `pipeline_upsert` (stage + note + nextStep).
4. Finish with the 3 highest-value follow-ups for today.
