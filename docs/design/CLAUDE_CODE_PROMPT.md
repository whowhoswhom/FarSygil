# FarSygil — Claude Code implementation prompt (real Next.js repo)

Implement the next real UI pass for FarSygil using the design export in this repo as the visual north star, and the design contract in this repo as the binding spec. This is an implementation pass in the real Next.js app, not a prototype-only pass.

## Repo

- `whowhoswhom/farsygil`
- current working tree / current local branch

## Primary references

- **Visual north star** — `docs/design/FarSygil UI Kit.html`
  Single self-contained file, committed in-repo; open in any browser.
- **Design contract** — `docs/design/DESIGN_CONTRACT.md`
  Committed in-repo. Treat as the authoritative spec for tokens, typography, surface recipe, spacing, hierarchy, copy, motion, sport labels, and real-data guardrails. All ambiguity is resolved by the contract.

If the export and the contract conflict, the **contract wins**. The export is illustrative; the contract is binding.

If `docs/design/DESIGN_CONTRACT.md` or `docs/design/FarSygil UI Kit.html` is missing, stop and report that immediately before doing any UI work. Do not implement against an absent contract or a missing visual reference.

## What the export gets right (port directionally)

- site-wide green-led accent direction
- dark premium field/background
- thicker slab-like surfaces with the calmer liquid-glass material
- stronger Hero / Recent / Archive band structure on `/activities`
- floating filter rail
- route preview as visual identity; honest indoor fallback artwork
- Geist Sans + Geist Mono
- a premium modular feel inspired by Apple Fitness, translated rather than copied

## What the export deliberately corrects (vs the earlier v1 mock)

The current export is the corrected version. When porting, preserve these corrections:

1. **Home is product-led, not roadmap-led.**
   A single full-bleed hero slab carries the page: wordmark, one-line subhead, and two primary actions. One connection-status row sits below it. No phase/roadmap card stack on Home.

2. **Recent uses true major slabs (`MajorTile`), not reused archive cards.**
   A `MajorTile` is materially different from a `MinorTile`: route art occupies the full top half edge-to-edge, the headline metric is hero-scale-adjacent, and sub-metrics sit on a single row. See `docs/design/DESIGN_CONTRACT.md` §5 for the exact recipe.

3. **The Synced totals strip is content-honest.**
   It is derived from real local activity rows, scoped to the **full local archive**, not the active filter slice. No hardcoded totals anywhere.

## Locked product/system decisions (do not relitigate)

1. Green is the site-wide accent direction.
2. Imperial units are the current global UI default: `mi`, `ft`, `/mi`, `mph`.
3. Geist Sans + Geist Mono stay in the real app.
4. Effort intensity is `sufferScore / 250` clamped to `[0,1]`, with `perceivedExertion / 10` as the fallback. If both are absent, the effort glow does not render.
5. Do **not** ship automatic ride-distance estimates in this pass.
6. **Absolutely no fake calories, ever.**

## Hard constraints

- no fake analytics
- no fake charts
- no invented data
- no estimated indoor-bike distance
- no fake calorie field
- no made-up training score
- no AI insight UI
- no implied features from later phases
- `/activities` must keep URL-synced filters / search / sort behavior; do not regress this
- read from real local SQLite-backed activity rows already in the app
- no sample data in the real app
- if a field is null, show `—` and preserve layout
- **do not create new routes in this pass**; phase context surfaces inside `/connect` only

## Surfaces to inspect first

Real app:
- `src/app/activities/*`
- `src/components/activities/*`
- `src/lib/activities/*`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/globals.css`
- `src/db/schema.ts`

Reference:
- `docs/design/FarSygil UI Kit.html`
- `docs/design/DESIGN_CONTRACT.md`

## Implementation goals by surface

### Home (`src/app/page.tsx`)

- Replace the current roadmap/documentation feel with a **single full-bleed hero slab** as described in `docs/design/DESIGN_CONTRACT.md` §5.
- Include:
  - wordmark
  - one-line subhead such as `A private archive of your real running.` or equivalent calm phrasing
  - two primary actions: **Connect Strava** and **Open Archive**
- Add one connection-status row beneath the hero; it should route to `/connect`.
- Keep one footer line.
- No roadmap stack. No marketing tone.
- Move phase/roadmap material off the front door. Surface phase context inside `/connect` only.

### Connect (`src/app/connect/page.tsx`)

- Visually align with the new system:
  - slab recipe
  - radii
  - kickers
  - tracked-uppercase micro-labels
  - accent-button + ghost-button
- Preserve all existing OAuth/token-status messaging verbatim.
- Keep the page calm; one card should carry it.

### Activities (`src/app/activities/*`, `src/components/activities/*`)

- Preserve:
  - real local-data reading
  - URL-synced filters
  - sport-aware metrics
  - reduced-motion support
- Strengthen the hero slab per `docs/design/DESIGN_CONTRACT.md` §5 #1.
- Add or refactor a `MajorTile` component in `src/components/activities/major-tile.tsx` and use it for the two-up Recent band. It must look materially different from `MinorTile`.
- Refactor the Synced totals strip into a component that computes totals from the activities table at render time.
  - **Scope: the full local archive**
  - it reflects every synced activity row in the local database
  - it is **not** recomputed against the active filter slice
  - the Filter HUD already owns slice-aware counts
  - each cell renders `—` only when there is no usable archived value for that field
  - no hardcoded numbers
  - footer caption stays factual and does not name a fake count
- Keep route preview as visual identity.
- Keep the indoor fallback honest.
- Filter HUD stays as the only sticky element.

## What NOT to port from any prior prototype

- sample activity objects such as `SAMPLE_ACTIVITIES` or `V2_ACTIVITIES`
- hardcoded totals like `128 efforts`, `762.4 mi`, `38,210 ft`, `112.6h moving`
- placeholder athlete or status data
- any copy that implies unsupported product state: training score, AI, projections, etc.
- any logic regression vs the current real app

## What must be preserved from the real app

- honest metric formatting in `src/lib/activities/format.ts`
- real field usage only, per `src/db/schema.ts`
- no synthetic indoor-bike distance
- no fake calories
- URL query-param filter sync on `/activities`
- reduced-motion support
- actual SQLite-backed activity reading
- the testable helper layer

## Expected implementation shape

- update real components and layout, not a throwaway prototype
- reuse existing helpers and formatters where sensible
- add or refactor components as needed:
  - stronger hero slab on `/`
  - `MajorTile` for the Recent band
  - `SyncedTotalsStrip` that computes from real full-archive data and renders `—` only when no usable archived value exists for that field
  - improved Home hero composition
- keep the design system coherent across Home, Connect, and Activities

## Acceptance criteria

- the real app clearly looks closer to the current design direction
- the site-wide green system feels coherent
- Home, Connect, and Activities feel like one product
- `/activities` feels more premium and modular than the current Archive v2
- the Recent band is visually distinct from the archive grid (`MajorTile`, not `MinorTile`)
- Synced totals are real, not hardcoded
- Synced totals are scoped to the full local archive, not the active filter slice
- no fabricated metrics are introduced
- imperial units remain consistent
- existing URL-synced filter behavior still works
- motion remains restrained and honors `prefers-reduced-motion`
- no new routes were created

## Verification — run and report

```bash
pnpm test
pnpm lint
pnpm db:generate
pnpm build
```

All four must pass. Paste the tail of each command's output into the final response.

## Brain-doc updates

If the implemented design/system meaningfully changes the Phase 1 UI description, update the relevant docs in `docs/brain/`. Specifically check:

- `docs/brain/00_PROJECT-BRAIN.md` — top-level UI description.
- `docs/brain/01_PRODUCT-VISION.md` — if the front-door framing changes.
- `docs/brain/13_ROADMAP-PHASES.md` (if present) — if Phase 1 surface scope shifts.

## Final response format

1. **Summary** — one paragraph.
2. **Key design translations** — bullet list of what changed in the real app, mapped to the contract.
3. **Real-data safeguards** — bullet list of what was removed, refactored, or guarded.
4. **Verification** — pasted tails of `pnpm test`, `pnpm lint`, `pnpm db:generate`, `pnpm build`.
5. **Brain-doc updates** — files touched, one-line each.
