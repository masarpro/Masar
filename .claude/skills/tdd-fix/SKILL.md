# TDD Fix Skill

When invoked with a bug, follow strict test-driven workflow:

1. First, write a test that reproduces the exact failure
2. Run the test to confirm it fails with the reported error
3. Implement the fix
4. Run the test again to confirm it passes
5. If first approach fails after 2 attempts, step back, re-read relevant files, and try a fundamentally different approach
6. Run full type-check before presenting the solution: `pnpm --filter @repo/web type-check`
7. Show the user: failing test output  fix  passing test output

## Rules
- Never claim a fix works without test verification
- If no test framework exists for the area, create a minimal reproduction script first
