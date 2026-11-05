# Competition Platform — Progress

**Updated:** 2026-11-05 (America/New_York)

## Shipped this phase

| Area | Status |
|------|--------|
| Schema: Contest.mode/status, ChallengeVersion, AiModel, AiBenchmarkRun, Challenge competition fields | Done (`prisma db push`) |
| Adversarial seeded generator + public meta | `src/server/competition/adversarial.ts` |
| AI benchmark (public prompt only; mocked = experimental) | `ai-benchmark.ts` + `/api/competition/benchmark` |
| Research Frontier D10 seeds | `research-frontier.ts` + `/research-frontier` |
| Leaderboards human/AI/team | `/leaderboards` + API |
| Tournaments list/register/create | `/tournaments` + API |
| AI vs Human UI | `/ai-vs-human` |
| Benchmark reports | `/benchmarks` |
| Diagnostics on execute GET + IDE | `diagnostics.ts` wired |
| Admin Competition analytics tab | `/api/competition/analytics` |
| Challenge list strips hidden/reference for non-admins | `/api/challenges` |
| Unit tests | `scripts/competition-unit.ts` (via `npm run test:unit`) |

## Policy locks

- Hidden tests / reference solutions never sent to AI models.
- Single AI fail ≠ “model cannot solve.”
- Mocked runs labeled experimental; verified only when API-backed.
- Broken harness → infrastructure diagnostic, not contestant failure.
- D10 Research Frontier remains objectively testable.

## Remaining dependencies

- Full sandbox re-judge of AI-generated code (currently signature/heuristic + counts; human path uses ExecutionJob).
- Optional provider keys for verified (non-mock) AI runs.
- Tournament brackets UI beyond standings JSON.
- Live calibrated difficulty from large submission samples.
