# Fix Build Skill

When invoked, execute these steps in order:

1. Run `pnpm --filter @repo/web type-check` from the project root to find all TypeScript errors
2. Fix all TypeScript errors across reported files (read each file first to match indentation)
3. Re-run `pnpm --filter @repo/web type-check` to confirm zero errors
4. Run `pnpm --filter @repo/web build` to verify production build succeeds
5. If build passes: `git add -A && git commit -m "fix: resolve build errors" && git push`

## Critical Rules
- NEVER run `tsc` from inside the `apps/web` directory directly  it causes thousands of false module resolution errors
- Always use `pnpm --filter @repo/web` from the project root
- If errors mention Prisma types, also check `@repo/database` separately: `pnpm --filter @repo/database type-check`
- If a fix reveals new errors, address them in the same session before declaring done
- After any Prisma schema change, run `pnpm --filter @repo/database generate` before type-check

## Project Context
- Package name for web app: `@repo/web`
- Monorepo uses pnpm workspaces
- Location: H:\Masar\supastarter-nextjs-3 (secondary) / D:\Masar\Masar (primary)
