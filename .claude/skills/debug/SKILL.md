# Debug Skill

Before making ANY code changes, complete this structured diagnosis.

## Problem (what's broken)
- Describe the exact error message, symptom, or unexpected behavior
- Identify error type: Zod validation | oRPC | Prisma | Runtime | Build | UI

## Root Cause Hypothesis (check before fixing)
- Read the error message carefully — trace the data flow through relevant files
- For Zod errors: check schema uses `.transform()` not `.nullish()`, verify Zod v4 compatibility
- For oRPC errors: ensure `ORPCError` is thrown, not plain `Error`
- For DB errors: check Prisma schema constraints (unique per-org vs global)
- For build errors: run typecheck from `apps/web/` — NEVER from root
- State your hypothesis and confidence level before proceeding

## Files to Change (list all)
- List every file that will need modification
- Check each file exists and read it before adding to the list
- Verify import paths with grep — do NOT guess

## Phases (ordered steps)
- Break the fix into small, verifiable steps
- Each phase should be independently testable
- Do NOT bundle unrelated changes

## Verification (how to confirm each phase works)
- After each phase: run `cd apps/web && npx tsc --noEmit`
- After all phases: run `pnpm build` from project root
- Check for related pre-existing issues that the fix may expose
- Run a smoke test of the full flow, not just the changed code path
