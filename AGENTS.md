# AGENTS.md

## Purpose

This file contains concise, machine-readable guidance for coding agents working in this repository. It complements README.md by focusing on commands, conventions, and rules agents should follow.

## Setup & common commands

- Install dependencies: `pnpm install`
- Run the dev server: `pnpm dev`
- Run tests: `pnpm test`
- Run a single test: `pnpm vitest run -t "<test name>"` (or the equivalent test runner command)
- Run linter: `pnpm lint`
- Run type checks: `pnpm typecheck`

## Project conventions

- Package manager: `pnpm` — use `pnpm` for installs and scripts; prefer workspace-aware flags like `--filter` when appropriate.
- TypeScript: project uses strict mode; prefer explicit public types and avoid `any`.

## Code style and patterns

- Functions: prefer arrow functions wherever possible. Use `function` only for named function declarations when necessary (e.g., constructors or when hoisting is specifically desired).

  Avoid explicit return types on functions; prefer inference for return values.
  For public/exported APIs you may add explicit return types where clarity or API stability requires it.

  Example:

  ```ts
  // preferred
  const add = (a: number, b: number) => a + b;

  // use function keyword only when needed
  function NamedConstructor(this: any) {
    // ...
  }
  ```

- Docstrings: add JSDoc / TSDoc comments for functions and exported APIs. Include short description, parameter types/meaning, and return value.

  Example:

  ```ts
  /**
   * Compute distance between two points.
   * @param a - [x, y] coordinates of the first point
   * @param b - [x, y] coordinates of the second point
   * @returns Euclidean distance
   */
  const distance = (a: [number, number], b: [number, number]) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  };
  ```

- Prefer array methods (`map`, `filter`, `reduce`, `some`, `every`, `find`) over manual loops for clarity and expressiveness. Use `for`/`for...of` only when mutation or performance requires it.

  Example:

  ```ts
  // preferred
  const evens = nums.filter((n) => n % 2 === 0);

  // avoid explicit index loops unless necessary
  // for (let i = 0; i < nums.length; i++) { ... }
  ```

- Prefer immutable, functional patterns and small pure helpers. Keep side effects explicit and limited to boundary layers.

- Use double quotes for strings, and prefer template literals when interpolation is needed.

  Example:

  ```ts
  const name = "Alice";
  const greeting = `Hello, ${name}!`;
  ```

## Formatting & linting

- Run `pnpm lint` and `pnpm format` before testing or committing. Follow existing Prettier / ESLint rules in the repo.
- If you add or change lint rules, update `package.json` scripts and add notes here.

## Testing

- Tests must pass locally. Use `pnpm test` and fix failing tests and type errors before opening a PR.
- When working on a single test, use the test runner's focused-run options (see Setup & common commands).

## PR checklist for agents

- Run `pnpm lint` and `pnpm test`.
- Update or add tests for behavior changes.
- Add or update docstrings for changed functions or public APIs.

## Agent guidance

- Agents should prefer the nearest `AGENTS.md` in the directory tree; repository-root `AGENTS.md` is the fallback.
- Explicit user instructions (chat prompts) override AGENTS.md.
- If AGENTS.md lists executable commands, agents may run them to verify changes.

## Contact / notes

If anything in this file conflicts with `README.md` or other docs, prefer the closest human-written guideline and confirm with a human reviewer.
