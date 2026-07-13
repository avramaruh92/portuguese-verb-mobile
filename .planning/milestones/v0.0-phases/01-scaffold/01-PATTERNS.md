# Phase 1: Scaffold - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 8
**Analogs found:** 0 / 8

## No Existing Codebase Patterns

This repo is greenfield: no `package.json`, no `app/`, no `src/`, no test files exist yet
(confirmed via `ls -la` and `test -f package.json` at the repo root, 2026-07-12). There is no
prior code to search for analogs — **this phase establishes the first patterns** for the
project. All "patterns" below come from 01-RESEARCH.md's Code Examples section (official Expo
docs / community conventions), not from this codebase, and should be read as the reference
templates the planner uses directly rather than as extracted excerpts from an existing analog
file.

Downstream phases (2-6) SHOULD treat the files created in this phase as the analogs for their
own pattern-mapping pass (e.g., Phase 2's dataset module can point to this phase's `src/store/`
structure for "how this repo organizes a `src/<domain>/` folder").

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|-----------------|----------------|
| `package.json` | config | N/A (manifest) | none — greenfield | no analog |
| `tsconfig.json` | config | N/A (manifest) | none — greenfield | no analog |
| `app/_layout.tsx` | route (root layout) | request-response (render) | none — greenfield | no analog |
| `app/index.tsx` | route (screen) | request-response (render) | none — greenfield | no analog |
| `src/store/useQuizStore.ts` | store | event-driven (state mutation, unused this phase) | none — greenfield | no analog |
| `__tests__/smoke.test.ts` | test | N/A (assertion) | none — greenfield | no analog |
| `__tests__/useQuizStore.test.ts` | test | N/A (assertion) | none — greenfield | no analog |
| `.gitignore` additions (`node_modules`, `.expo`, etc.) | config | N/A | existing `.gitignore` (already present, planning-doc-focused) | partial — extend, don't replace |

## Pattern Assignments

Since there is no in-repo analog for any file, the planner should use 01-RESEARCH.md's `## Code
Examples` section verbatim as the source-of-truth templates. Reproduced here for convenience
with source attribution (all from `.planning/phases/01-scaffold/01-RESEARCH.md`, which itself
cites official Expo docs):

### `app/_layout.tsx` (route, request-response)

**Source:** 01-RESEARCH.md "Minimal root layout + single route" (attributed to
docs.expo.dev/router/introduction/)

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

No auth/guard pattern applies (no auth in this product — CLAUDE.md "Auth Model: None"). No error
handling needed at this layer this phase.

---

### `app/index.tsx` (route/screen, request-response)

**Source:** 01-RESEARCH.md, same section, attributed to `01-UI-SPEC.md` for exact placeholder
text ("Portuguese Verb Quiz")

```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Portuguese Verb Quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  heading: { fontSize: 20, fontWeight: '600', color: '#000000' },
});
```

---

### `src/store/useQuizStore.ts` (store, event-driven — unused scaffold this phase)

**Source:** 01-RESEARCH.md "Zustand store scaffold + import-safety test"

```ts
import { create } from 'zustand';

interface QuizStoreState {
  status: 'idle';
}

export const useQuizStore = create<QuizStoreState>(() => ({
  status: 'idle',
}));
```

Per CONTEXT.md D-02, this file lives in `src/store/` (not `app/`) — `app/` is routes-only. This
establishes the convention later phases follow for `src/dataset/`, `src/quiz-engine/`,
`src/api/`.

---

### `__tests__/smoke.test.ts` (test)

**Source:** 01-RESEARCH.md "Trivial jest-expo smoke test"

```ts
describe('jest-expo smoke test', () => {
  it('runs and passes', () => {
    expect(1 + 1).toBe(2);
  });
});
```

---

### `__tests__/useQuizStore.test.ts` (test)

**Source:** 01-RESEARCH.md, same section as the store scaffold

```ts
import { useQuizStore } from '../src/store/useQuizStore';

describe('useQuizStore scaffold', () => {
  it('imports and initializes without runtime error', () => {
    expect(useQuizStore.getState().status).toBe('idle');
  });
});
```

Test naming/location convention this establishes: `__tests__/<subject>.test.ts` at repo root,
one file per test suite. Later phases (dataset validation, quiz-engine, feedback payload tests)
should follow this same flat `__tests__/` convention unless a later phase's RESEARCH.md
explicitly changes it (e.g., colocating tests next to source files).

---

### `tsconfig.json` (config)

**Source:** 01-RESEARCH.md "tsconfig.json (strict mode, criterion 3)", attributed to
docs.expo.dev/guides/typescript/

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["jest"]
  }
}
```

---

### `package.json` (config — jest + scripts sections)

**Source:** 01-RESEARCH.md "package.json test wiring"

```json
{
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

Note the deliberate deviation from official Expo docs' `"test": "jest --watchAll"` — RESEARCH.md
Pitfall 2 flags `--watchAll` as never-exiting and wrong for scripted verification. Use plain
`"test": "jest"` as the default script; add `"test:watch"` separately only if desired.

## Shared Patterns

### Package installation convention
**Source:** 01-RESEARCH.md Standard Stack / Installation
**Apply to:** All dependency additions this phase and future phases
```bash
npx create-expo-app@latest --template default@sdk-57
npx expo install zustand zod
npx expo install -D jest-expo @types/jest
```
Always use `npx expo install <pkg>`, never plain `npm install`, for Expo-adjacent packages —
keeps versions in Expo's SDK-compatibility table (RESEARCH.md Pitfall 4).

### Folder structure convention (D-02)
**Source:** 01-CONTEXT.md D-02
**Apply to:** All future phases adding domain logic
`app/` stays routes-only (Expo Router file-based routing). All domain logic lives in a sibling
`src/` tree: `src/dataset/`, `src/quiz-engine/`, `src/store/`, `src/api/`. Phase 1 only creates
`src/store/` — later phases create their own subfolder when they have real content, per
RESEARCH.md's explicit note not to pre-create empty placeholder folders.

### Template-then-subtract convention
**Source:** 01-RESEARCH.md Pattern 1 / Anti-Patterns
**Apply to:** The scaffold task itself
Scaffold from `npx create-expo-app@latest --template default@sdk-57` (ships Router + TS + a tabs
demo), then run `npm run reset-project` (or manually delete `app/(tabs)/` and demo
components/hooks/constants folders) to reach D-04's single-route requirement. Verify with `ls
app/` that only `_layout.tsx` and `index.tsx` remain — do not leave the tabs demo in place.

## No Analog Found

All 8 files listed in File Classification have no analog — this is expected and correct for a
phase-1 scaffold of a greenfield repo. The planner should use the Code Examples above (sourced
from RESEARCH.md / official Expo docs) as the direct implementation templates rather than
searching for in-repo precedent.

## Metadata

**Analog search scope:** Entire repo root (`ls -la`, `test -f package.json`) — confirmed no
`package.json`, `app/`, `src/`, or test directories exist.
**Files scanned:** 0 source files (none exist); repo root directory listing only.
**Pattern extraction date:** 2026-07-12
</content>
