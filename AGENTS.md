# AGENTS.md

## Purpose

This file contains concise, machine-readable guidance for coding agents working in this repository. It complements README.md by focusing on commands, conventions, and rules agents should follow.

## Setup & Common Commands

- Install dependencies: `pnpm install`
- Run the dev server: `pnpm dev`
- Run tests: `pnpm test`
- Run a single test: `pnpm vitest run -t "<test name>"` (or the equivalent test runner command)
- Run linter: `pnpm lint`
- Run type checks: `pnpm typecheck`

## Project Conventions

- Package manager: `pnpm` — use `pnpm` for installs and scripts; prefer workspace-aware flags like `--filter` when appropriate.
- TypeScript: project uses strict mode; prefer explicit public types and avoid `any`.

## Code Style and Patterns

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
- Always check if failing tests are not marked with `.fails()` and are actually passing.
- Tests are implemented using Vitest; follow existing test patterns and structure. Add new tests for new features or bug fixes.
- Vitest allows to set a [timeout](https://vitest.dev/guide/cli.html#testtimeout) for tests via the CLI via `--testTimeout`.

## PR checklist for agents

- Run `pnpm lint` and `pnpm test`.
- Update or add tests for behavior changes.
- Add or update docstrings for changed functions or public APIs.

## Agent guidance

- Agents should prefer the nearest `AGENTS.md` in the directory tree; repository-root `AGENTS.md` is the fallback.
- Explicit user instructions (chat prompts) override AGENTS.md.
- If AGENTS.md lists executable commands, agents may run them to verify changes.

## Schematization Algorithm

### Use Case

The algorithm is designed for schematizing geodata. In the test cases I use simple synthetic data with mostly integer coordinates, but the algorithm should work for any kind of polygon geodata.

C, the set of allowed orientations for the output edges, can be defined by the user. In the test cases I mostly use the 2 main orientations resulting in 4 angles (0, 90, 180, 270 degrees), but the algorithm should work for any set of orientations. It can be regular (e.g. every 15 degrees) or irregular (e.g. 0, 45, 90, 135 degrees). The algorithm should be able to handle any set of orientations, that is greater than or equal to 2.

### Overview

The algorithm for schematization is as follows:

- Define C, the set of orientations that the output edges should be aligned to. For example, we want to align edges to the 4 main orientations (0, 90, 180, 270 degrees).
- Create a DCEL (Doubly Connected Edge List) from the input region (collection of polygons).
- Preprocessing: Subdivide the DCEL's edges into smaller edges if they exceed a certain length threshold.
- Constrain angles:
  1. Classify vertices into significant / non-significant
  2. Subdivided edges when both of their endpoints are significant.
  3. Classify edges based on their significant vertex if they have one, or any of the two vertices, in relation to the defined C.
  4. Calculate staircases based on the edges class. Each staircase consists of edges that are all aligned to the orientations defined in C.
  5. Replace edges with staircases. Now all edges are aligned to the orientations defined in C. But the number of edges may have increased significantly. So in order to actually making it "schematic" we need to reduce the number of edges in the next step.
- Simplification via area-preserving edge-moves: at this point all edges are already aligned to the orientations defined in C. Hence, we can only move edges along these orientations: edge moves should never change the orientation of any edge.
  1. As a first step we remove collinear vertices: they don't add any information and just increase the complexity of the DCEL
  2. Then we create configurations:The edge move works with configurations: sets of 3 adjacent edges. Configurations consist of two outer edges and one inner edge (the middle edge). It has two tracks which are defined by the configuration's outer edges: a track is a line (infinite) through the outer edge (which is a line segment). The inner edge is moved during the edge move. For a valid, area-preserving edge move, a compensation configuration needs to exist. Such a configuration can compensate for the area change caused by the movement of the contraction edge: i.e., the contraction area of the contraction configuration needs to be equal or smaller to the contraction area of the compensation configuration. A configuration can have a positive, a negative, or both contraction areas.
  3. Then we create a FaceFaceBoundary list, which is a list of all the faces that are adjacent to each other and the edges they share. In order to make sure that the area of the DCEL is preserved, we can only move edges that are on the same FaceFaceBoundary. So we group the edges by their FaceFaceBoundary and we can only move edges of configurations within the same group.
  4. The next task is to find the best candidate for an edge move across the entire DCEL using the FaceFaceBoundary list. The best candidate is the one where the contraction area of the Configuration is the smallest. And it needs to be valid with the compensation configuration. Also closer configurations (number of edges between them) are preferred.
  5. Once we have a valid configuration pair we can execute the edge move. This process is repeated until we have reduced the number of edges to a certain threshold or we can't find any valid edge moves anymore.
     - The edge move is executed by moving both vertices of the inner edges along the configuration's tracks (each endpoint is positioned on a track at the beginning of the edge move).
     - There are two cases which need differentiation:
       - If the configuration pair shares exactly one outer edge, this edge needs to degenerate into a point and the adjacent inner edges need to move towards each in a ratio so that the area change is compensated. This is a common case.
       - If the configuration pair doesn't share any outer edge, the inner edge of the contraction configuration can be moved along its track until the calculated contraction point is reached. In a second step the inner edge of the compensation configuration can be moved along its tracks until it compensated for the area change caused by the movement of the contraction edge.

## Contact / Notes

If anything in this file conflicts with `README.md` or other docs, prefer the closest human-written guideline and confirm with a human reviewer.
