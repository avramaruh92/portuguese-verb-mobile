# Phase 17: Contract Fixture Verification - Research

**Researched:** 2026-07-21
**Domain:** Cross-repo contract testing (backend-shipped JSON fixture consumed by mobile's existing Zod/runtime parsing paths); no new libraries, no new UI
**Confidence:** HIGH

## Summary

This phase has no unknowns about *what* to build — the source-of-truth fixture already
exists, checked into the sibling backend repo, and the mobile runtime paths it must be
proven against (`validateDataset`, `LearningContentSchema`, `fetchRemoteVerbs`) already
exist unchanged from v0.3. The only work is: copy the fixture into the mobile repo's test
tree as a static, version-controlled JSON file (no cross-repo import, no build step, no
network call at test time), and write one new Jest test file that feeds it through the
three existing parsing paths, asserting zero errors and byte-for-byte preservation of a
few known tricky substrings (accented `pôr`/`pôs`, tied `falam`).

The sibling backend repo is at `~/portuguese-verb/portuguese-verb-backend` (NOT
`portuguese-verb-api` as CLAUDE.md's older cross-repo references imply — that name is
stale/aspirational; the actual local directory name is `portuguese-verb-backend`). The
exact fixture file is `contracts/content-verbs-v0.4.sample.json` in that repo (8,989
lines, 50 verbs, top-level `{ verbs: [...], learning: {...} }" shape). The backend's own
Phase 15 (`15-content-contract-fixture`) already built and vitest-tested this exact
fixture against its own `verbSeedSchema`/`buildLearningContentSchema`, including a
staleness guard against a live `GET /content/verbs` call — mobile's Phase 17 does not
need to replicate that staleness check (that's the backend's job to keep the fixture
fresh); mobile only needs to prove its *own* parsing paths accept the fixture as shipped.

**Primary recommendation:** Copy
`~/portuguese-verb/portuguese-verb-backend/contracts/content-verbs-v0.4.sample.json`
verbatim (byte-for-byte, do not reformat/re-serialize it) into a new mobile-repo path —
e.g. `__tests__/fixtures/content-verbs-v0.4.sample.json` — and add one new test file
(e.g. `__tests__/contract-fixture.test.ts`) that `require`/`import`s it via a relative
path (no `fs.readFileSync` against the sibling repo, no monorepo tooling, no symlink).
Use Jest's native JSON import support (`import fixture from "./fixtures/....json"`),
which is the simplest zero-dependency approach and matches this repo's "no cross-repo
import at test runtime" requirement exactly.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fixture storage | Test tree (mobile repo) | — | Must be self-contained per CONTRACT-01; no build-time or test-time fetch from sibling repo or network |
| Fixture-to-runtime parsing proof | Domain logic (`src/dataset/`, `src/learning/`) | Test tree | Existing pure-function/Zod modules are the systems under test; no new production code needed |
| String-fidelity assertion (accents/ties) | Test tree | — | Pure JS string comparison against literal expected values; no new abstraction needed |

## Standard Stack

No new libraries required. This phase is 100% additive test code + one static JSON
fixture file, using infrastructure already present in the mobile repo.

### Core (existing, no changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jest` (via `jest-expo` preset) | `jest-expo` ~57.0.1 [VERIFIED: package.json] | Test runner | Already the project's only test runner |
| `zod` | ^4.4.3 [VERIFIED: package.json] | Runtime schema validation (`VerbSchema`, `LearningContentSchema`) | Already the project's only validation library; `validateDataset`/`LearningContentSchema` are Zod schemas the fixture is validated against |
| TypeScript `resolveJsonModule` | via `expo/tsconfig.base` [ASSUMED — verify at plan time] | Enables `import fixture from "./fixtures/x.json"` | Standard Expo/TS project default; confirm `tsconfig.json` doesn't disable it (not currently overridden in this repo's `tsconfig.json`) |

### Supporting
None needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static JSON import (`import fixture from "./x.json"`) | `fs.readFileSync(path.join(__dirname, "x.json"))` | `fs.readFileSync` works identically in Jest (Node environment) and avoids any TS `resolveJsonModule` dependency; slightly more verbose but more defensive if `resolveJsonModule` turns out to be off. **Recommend this as the safer default** since it has zero TS-config coupling — matches the backend repo's own fixture test (`contracts/content-verbs-v0.4.sample.test.ts`), which uses `fs.readFileSync(new URL(...))` rather than a bare import. |
| Copying fixture as a flat file | Generating fixture via a mobile-side script (mirroring backend's `generate-content-fixture.ts`) | Not applicable — mobile has no seed data or backend app to run `buildApp()` against; mobile must consume the artifact, not regenerate it. A regeneration script would require cross-repo coupling this phase explicitly forbids. |

**Installation:** none required.

**Version verification:** No new packages — nothing to verify against a registry.

## Package Legitimacy Audit

Not applicable — this phase installs no external packages.

## Architecture Patterns

### System Architecture Diagram

```
Backend repo (portuguese-verb-backend)          Mobile repo (portuguese-verb-mobile)
──────────────────────────────────────          ─────────────────────────────────────
contracts/content-verbs-v0.4.sample.json   ──copy (manual, one-time)──▶  __tests__/fixtures/content-verbs-v0.4.sample.json
  (generated by scripts/                                                        │
   generate-content-fixture.ts,                                                 │ import/readFileSync
   vitest-verified against backend's                                            ▼
   own verbSeedSchema/                                              __tests__/contract-fixture.test.ts
   buildLearningContentSchema)                                                  │
                                                                                  ├──▶ validateDataset(fixture.verbs)
                                                                                  │      (src/dataset/validate.ts)
                                                                                  ├──▶ LearningContentSchema.safeParse(fixture.learning)
                                                                                  │      (src/learning/schema.ts)
                                                                                  ├──▶ fetchRemoteVerbs() parsing path
                                                                                  │      (src/dataset/remote.ts, with
                                                                                  │       globalThis.fetch mocked to
                                                                                  │       resolve the fixture as the
                                                                                  │       JSON body — same pattern as
                                                                                  │       __tests__/dataset-remote.test.ts)
                                                                                  └──▶ byte-for-byte string assertions
                                                                                         (fixture.verbs["falar"].formIndex.falam
                                                                                          .length === 2; fixture.verbs
                                                                                          .find(v => v.verb === "pôr")…)
```

No new runtime component is introduced — the diagram shows a one-time manual copy step
(no ongoing sync/build dependency) feeding a single new test file that exercises three
already-shipped parsing entry points.

### Recommended Project Structure
```
__tests__/
├── fixtures/                              # NEW — static test-only data, no src/ coupling
│   └── content-verbs-v0.4.sample.json     # NEW — verbatim copy of backend's contracts/content-verbs-v0.4.sample.json
└── contract-fixture.test.ts               # NEW — the CONTRACT-01/02/03 proof test
```

This mirrors the existing convention: `__tests__/` is flat, one file per concern, no
co-location with `src/`. Adding a `fixtures/` subdirectory under `__tests__/` is a new
but minimal convention — there is no existing fixtures directory in the mobile repo to
follow instead (confirmed: no `__fixtures__`, no `fixtures/` anywhere in the mobile repo
prior to this phase).

### Pattern 1: Mocking `fetchRemoteVerbs`'s HTTP boundary with the fixture as the response body
**What:** Reuse the exact `globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture })` pattern already used in `__tests__/dataset-remote.test.ts`, but pass the *real* fixture object as the JSON body instead of the hand-built `sampleVerb`/`sampleLearningContent` fixtures used in that file's existing tests.
**When to use:** For CONTRACT-02's "proves through `fetchRemoteVerbs`'s parsing path" requirement — this is the only way to exercise `fetchRemoteVerbs` without a real network call, and it's the established convention in this codebase.
**Example:**
```typescript
// Source: __tests__/dataset-remote.test.ts (existing pattern in this repo)
import fixture from "./fixtures/content-verbs-v0.4.sample.json";
import { fetchRemoteVerbs } from "../src/dataset/remote";

it("parses the real backend v0.4 fixture through fetchRemoteVerbs", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => fixture,
  }) as unknown as typeof fetch;

  const result = await fetchRemoteVerbs();

  expect(result.verbs).toHaveLength(50);
  expect(result.learning).toBeDefined();
});
```

### Pattern 2: Directly exercising `validateDataset` and `LearningContentSchema` without going through `fetchRemoteVerbs`
**What:** CONTRACT-02 asks for three *separate* proofs (`validateDataset`, `LearningContentSchema.safeParse`, and `fetchRemoteVerbs`), not just one end-to-end test. Write these as three distinct `it()` blocks (or `describe` groups) so a future regression in any one layer fails independently and legibly — matching this repo's existing preference for small, single-purpose test cases (see `CONVENTIONS.md`'s "Function Design" section, which this test-writing style mirrors).
**Example:**
```typescript
import fixture from "./fixtures/content-verbs-v0.4.sample.json";
import { validateDataset } from "../src/dataset/validate";
import { LearningContentSchema } from "../src/learning/schema";

it("validateDataset accepts the fixture's verbs with zero errors", () => {
  const { valid, errors } = validateDataset(fixture.verbs);
  expect(valid).toBe(true);
  expect(errors).toEqual([]);
});

it("LearningContentSchema accepts the fixture's learning block", () => {
  const result = LearningContentSchema.safeParse(fixture.learning);
  expect(result.success).toBe(true);
});
```

### Anti-Patterns to Avoid
- **Re-serializing/reformatting the fixture on copy:** Do not run the JSON through a
  formatter or re-`JSON.stringify()` it before committing — this risks silently
  normalizing Unicode or reordering keys in a way that defeats the "exactly as shipped"
  intent of CONTRACT-01. Copy the file's bytes as-is (`cp`, not an editor "save").
- **Importing the fixture from the sibling repo's absolute path at test runtime:** e.g.
  `fs.readFileSync("/Users/avi/portuguese-verb/portuguese-verb-backend/contracts/...")`.
  This would violate CONTRACT-01's explicit "no cross-repo import at test runtime"
  requirement and would break in CI or on any other machine where that sibling path
  doesn't exist. The fixture must be copied into the mobile repo, not referenced in
  place.
- **Testing only the happy-path end-to-end (`fetchRemoteVerbs` alone):** Skipping the
  direct `validateDataset`/`LearningContentSchema.safeParse` calls would satisfy CONTRACT-02's
  spirit but not its letter (three named proofs) and would make future failures harder to
  localize (a failure in `fetchRemoteVerbs` alone doesn't tell you which of its two
  internal parse steps broke).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verifying the fixture is byte-identical to the backend's copy | A custom diff/hash-check script comparing the two repos | Nothing — out of scope for this phase (no cross-repo tooling is being introduced); the one-time manual copy IS the verification step, performed by whoever runs the copy | The backend repo already vitest-verifies the fixture's freshness against its own live route (`content-verbs-v0.4.sample.test.ts`'s "is not stale vs a fresh generated response (D-05)" test); duplicating that concern in the mobile repo would require cross-repo coupling this phase explicitly forbids |
| Unicode string comparison | A custom NFC/NFD normalization helper | Plain `===` string equality / `toBe()` | Verified (see Common Pitfalls below): the fixture's accented characters are already stored in precomposed NFC form (Node's default `JSON.parse` does not alter Unicode normalization), and JS string literals in the new test file (e.g. `"pôr"`) written by a standard editor are also NFC by default — so direct equality works without any normalization step |

**Key insight:** This phase should add zero new production abstractions. Everything
needed to satisfy CONTRACT-01/02/03 already exists in `src/dataset/validate.ts`,
`src/dataset/remote.ts`, and `src/learning/schema.ts` — the task is purely test
authorship plus one static asset.

## Common Pitfalls

### Pitfall 1: Assuming the fixture needs a `formIndex`-stripping step before `validateDataset`
**What goes wrong:** The backend's own fixture test (`content-verbs-v0.4.sample.test.ts`)
strips `formIndex` before validating each verb against its `verbSeedSchema`
(`const { formIndex: _formIndex, ...rest } = verb;`) — this might look like a required
step to copy.
**Why it happens:** The backend's `verbSeedSchema` is a *stricter* seed-only schema that
predates `formIndex` and doesn't know about the field. Mobile's `VerbSchema` (in
`src/dataset/validate.ts`) is different — it explicitly includes
`formIndex: z.record(z.string(), z.array(FormMatchSchema)).optional()` as part of its
schema.
**How to avoid:** Do NOT strip `formIndex` before calling `validateDataset` in the mobile
test — pass `fixture.verbs` as-is. `formIndex` is a first-class optional field in
mobile's schema and stripping it would test a shape the fixture doesn't actually produce
in the wild.
**Warning signs:** If a plan or test strips fields from the fixture before validating,
double-check against `src/dataset/validate.ts`'s actual `VerbSchema` shape first.

### Pitfall 2: TypeScript `import` of a `.json` file failing type-checking or Jest module resolution
**What goes wrong:** `import fixture from "./fixtures/content-verbs-v0.4.sample.json"`
requires `resolveJsonModule: true` in `tsconfig.json` (inherited via `expo/tsconfig.base`,
not overridden in this repo's `tsconfig.json` — but not independently confirmed at
research time) and Jest's default resolver already supports `.json` requires natively, so
the Jest side is not a risk; the TypeScript side is the only unverified link.
**Why it happens:** Some `tsconfig.json` bases set `resolveJsonModule: false` explicitly
or omit it, and `noUncheckedIndexedAccess`/`strict` mode can make destructuring the
imported JSON's shape awkward without an explicit type assertion.
**How to avoid:** Prefer `fs.readFileSync(path.join(__dirname, "fixtures/....json"), "utf-8")` + `JSON.parse(...)` inside the test file instead of a bare `import` — this
sidesteps any TS module-resolution question entirely and matches the backend repo's own
established pattern for reading this exact file. Type the parsed result loosely (e.g.
`as { verbs: unknown[]; learning: unknown }`) and let the Zod schemas do the real
validation work — don't try to force it into the `Verb[]`/`LearningContent` types before
the schemas have proven it's shaped correctly.
**Warning signs:** A `tsc --noEmit` failure on the fixture import line, or Jest failing
to resolve the `.json` path.

### Pitfall 3: Unicode normalization mismatches on accented-character assertions
**What goes wrong:** Portuguese accented characters (ô, ã, á, ç, etc.) can be represented
in Unicode two ways — precomposed (NFC, one codepoint per accented letter, e.g. `ô` =
U+00F4) or decomposed (NFD, base letter + combining accent, e.g. `o` U+006F + combining
circumflex U+0302). A test asserting `fixture.verbs.find(v => v.verb === "pôr")` could
silently fail to match if the fixture's JSON encodes `pôr` in NFD while the test file's
own `"pôr"` string literal is NFC (or vice versa) — this is a well-documented JS gotcha
because `===` compares codepoints, not visual glyphs.
**Why it happens:** Different editors, git configurations (notably older macOS HFS+
behavior, though not relevant to plain git blobs), or copy-paste sources can introduce
NFD strings without any visible difference in a text editor.
**How to avoid:** [VERIFIED via direct inspection] The fixture's `"pôr"` string is stored
as NFC (`['0x70', '0xf4', '0x72']` — single codepoint `U+00F4` for `ô`, confirmed via
Python's `unicodedata.normalize("NFC", s) == s`). As long as the new test file's own
literal `"pôr"`/`"pôs"`/`"falam"` strings are typed normally in a standard editor (which
defaults to NFC), direct `===`/`toBe()` comparison will work without any normalization
call. If this ever becomes flaky, the fix is `.normalize("NFC")` on both sides before
comparing — but it should not be needed given the current fixture's encoding.
**Warning signs:** A string-equality assertion failing despite the two strings looking
character-for-character identical when printed/logged.

### Pitfall 4: CLAUDE.md's stale sibling-repo name reference
**What goes wrong:** CLAUDE.md and `.planning/codebase/*.md` refer to the sibling repo as
`portuguese-verb-api` (`avramaruh92/portuguese-verb-backend` GitHub slug) in several
places. The actual local directory checked at research time is
`~/portuguese-verb/portuguese-verb-backend`, not `~/portuguese-verb/portuguese-verb-api`.
**Why it happens:** Naming likely drifted between when CLAUDE.md was last written and the
actual local clone/rename of the sibling repo.
**How to avoid:** When a task references "the backend repo" for a manual copy step,
resolve the path at execution time (`ls ~/portuguese-verb/`) rather than hardcoding
`portuguese-verb-api` from CLAUDE.md's prose. This research confirms the correct local
path is `~/portuguese-verb/portuguese-verb-backend`.
**Warning signs:** A "directory not found" error on a hardcoded `portuguese-verb-api` path.

## Code Examples

### Full fixture-fidelity test (CONTRACT-03)
```typescript
// Source: fixture inspected directly at
// ~/portuguese-verb/portuguese-verb-backend/contracts/content-verbs-v0.4.sample.json
it("preserves accented and tied conjugation forms byte-for-byte", () => {
  const falar = fixture.verbs.find((v: { verb: string }) => v.verb === "falar");
  const por = fixture.verbs.find((v: { verb: string }) => v.verb === "pôr");

  expect(falar).toBeDefined();
  expect(por).toBeDefined();

  // Tied forms: "falam" is both voces and eles_elas in present_indicative
  expect(falar.formIndex.falam).toHaveLength(2);
  expect(falar.conjugations.present_indicative.voces).toBe("falam");
  expect(falar.conjugations.present_indicative.eles_elas).toBe("falam");

  // Accented forms
  expect(por.conjugations.preterite.ele_ela).toBe("pôs");
  expect(por.verb).toBe("pôr");
});
```

## State of the Art

Not applicable — no framework/library version currency question here; this is a
same-day cross-repo contract sync between two repos under active development by the same
team (backend v0.4 tag exists at `.git/refs/tags/v0.4` in the backend repo).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tsconfig.json`'s inherited `expo/tsconfig.base` has `resolveJsonModule: true` (not independently confirmed by reading that base config file) | Standard Stack, Pitfall 2 | Low — mitigated by recommending `fs.readFileSync` + `JSON.parse` instead of a bare `import`, which sidesteps this entirely regardless of the setting |
| A2 | The one-time fixture copy is a manual step performed by the plan/task executor (e.g. `cp` at plan-execution time), not an automated sync mechanism | Summary, Don't Hand-Roll | Low — if the planner instead wants a script, the backend's `generate-content-fixture.ts` cannot run in the mobile repo anyway (no backend app/seed data available), so a manual copy is the only viable approach either way |

**If this table is empty:** N/A — see entries above; both are low-risk mitigated assumptions, not decisions requiring user confirmation before planning.

## Open Questions

1. **Should the mobile-side test also assert `fixture.verbs` has exactly 50 entries and `fixture.learning.version === 1`, mirroring the backend's own fixture test's shape checks?**
   - What we know: The backend's own `content-verbs-v0.4.sample.test.ts` asserts `expect(fixture.verbs).toHaveLength(50)` and `expect(fixture.learning.version).toBe(1)` as a sanity check before deeper validation.
   - What's unclear: Whether this is in scope for mobile's CONTRACT-02/03 (which only name `validateDataset`, `LearningContentSchema.safeParse`, and `fetchRemoteVerbs` explicitly) or would be redundant/out-of-scope duplication of the backend's own fixture test.
   - Recommendation: Include it as a cheap, low-risk sanity assertion at the top of the new test file (it costs nothing and catches an obviously-wrong fixture copy early), but do not treat it as satisfying any of CONTRACT-01/02/03 on its own.

2. **Should `formIndex` values also be spot-checked in the byte-for-byte assertion (CONTRACT-03), or is checking the raw `conjugations` strings sufficient?**
   - What we know: CONTRACT-03 names "accented forms" and "tied forms" — both are visible directly in `conjugations` (e.g. `conjugations.preterite.ele_ela === "pôs"`) and in `formIndex` (e.g. `formIndex.falam` having length 2 for the tie).
   - What's unclear: Whether the planner should require both representations to be asserted, or just one is sufficient to satisfy the requirement.
   - Recommendation: Assert both, since they're cheap and exercise two different parts of the parsed shape (`conjugations` proves `VerbSchema`'s nested tense/subject validation passed correctly; `formIndex` length proves the `FormMatchSchema` array parsing preserved the tie without collapsing duplicates).

## Environment Availability

Not applicable — this phase has no external tool/service dependencies. It touches only
files already present locally (the sibling backend repo's fixture file, readable via a
plain filesystem copy) and existing project infrastructure (Jest, Zod, TypeScript). No
network calls occur at test time; `fetchRemoteVerbs`'s HTTP call is mocked exactly as it
already is in `__tests__/dataset-remote.test.ts`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `jest-expo` preset ~57.0.1 [VERIFIED: package.json] |
| Config file | `package.json`'s `"jest": { "preset": "jest-expo" }` field — no standalone `jest.config.*` file exists |
| Quick run command | `npm test -- __tests__/contract-fixture.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTRACT-01 | Fixture file exists in mobile repo test tree, no cross-repo import at runtime | static/structural (verified by file presence + no `fs`/`import` path pointing outside repo) | `git ls-files __tests__/fixtures/content-verbs-v0.4.sample.json` (existence) + code review of the new test file's import statement | ❌ Wave 0 — fixture file and test file are both new |
| CONTRACT-02 | `validateDataset(payload.verbs)` returns zero errors on the fixture | unit | `npm test -- __tests__/contract-fixture.test.ts -t "validateDataset"` | ❌ Wave 0 |
| CONTRACT-02 | `LearningContentSchema.safeParse(payload.learning)` succeeds on the fixture | unit | `npm test -- __tests__/contract-fixture.test.ts -t "LearningContentSchema"` | ❌ Wave 0 |
| CONTRACT-02 | Fixture parses successfully through `fetchRemoteVerbs`'s parsing path | unit (fetch mocked) | `npm test -- __tests__/contract-fixture.test.ts -t "fetchRemoteVerbs"` | ❌ Wave 0 |
| CONTRACT-03 | Accented (`pôr`/`pôs`) and tied (`falam`) forms survive parsing unchanged | unit | `npm test -- __tests__/contract-fixture.test.ts -t "byte-for-byte"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- __tests__/contract-fixture.test.ts`
- **Per wave merge:** `npm test` (full suite — this phase is small enough it's likely one wave)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/fixtures/content-verbs-v0.4.sample.json` — copy from
      `~/portuguese-verb/portuguese-verb-backend/contracts/content-verbs-v0.4.sample.json`
      (manual, byte-for-byte, no reformatting)
- [ ] `__tests__/contract-fixture.test.ts` — new test file covering CONTRACT-01/02/03
- Framework install: none — Jest/`jest-expo`/Zod already installed and configured

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — no auth in this product |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Yes | Already covered by existing `VerbSchema`/`LearningContentSchema` Zod schemas — this phase adds no new validation surface, only a test proving the existing validation accepts a specific, known-good real-world payload |
| V6 Cryptography | No | N/A — no cryptographic operations in this phase |

### Known Threat Patterns for this stack

Not applicable — this phase adds no new network-facing code, no new user input surface,
and no new external package. The only "new" data is a static, checked-in JSON test
fixture copied from a trusted sibling repo under the same developer's control, never
loaded at production runtime (test-tree only). There is no meaningful STRIDE surface to
analyze for this phase.

## Sources

### Primary (HIGH confidence)
- Direct file reads: `src/dataset/validate.ts`, `src/dataset/remote.ts`,
  `src/learning/schema.ts`, `__tests__/dataset-remote.test.ts` (this repo) — current,
  unmodified since v0.3 ship
- Direct file reads:
  `~/portuguese-verb/portuguese-verb-backend/contracts/content-verbs-v0.4.sample.json`,
  `~/portuguese-verb/portuguese-verb-backend/contracts/content-verbs-v0.4.sample.test.ts`,
  `~/portuguese-verb/portuguese-verb-backend/scripts/generate-content-fixture.ts` (sibling
  repo, git history confirms these were added together in commits `8fa1fb1`/`e25a8ed`)
- Direct Python inspection of the fixture's Unicode codepoints (`pôr` confirmed NFC)

### Secondary (MEDIUM confidence)
- None used — all critical claims verified by direct file/tool inspection in this
  session, not by web search.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all verified against `package.json` and existing source
- Architecture: HIGH — fixture location and shape directly inspected, existing parsing paths read in full
- Pitfalls: HIGH — Unicode normalization claim independently verified via codepoint inspection, not assumed

**Research date:** 2026-07-21
**Valid until:** Effectively indefinite for this phase's scope (static fixture + existing
schemas) — but re-verify the fixture copy is still current if the backend repo's
`contracts/content-verbs-v0.4.sample.json` changes again before this phase executes.
