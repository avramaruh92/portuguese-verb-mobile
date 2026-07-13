# Phase 6 Dataset Discrepancy Findings

**Purpose:** Independent re-derivation of all 50 verbs × 4 tenses × 6 subjects
(1,200 cells) in `src/dataset/verbs.ts`, per Phase 6 D-01. Every cell below was
derived from European Portuguese conjugation rules (regular endings by
infinitive class, or known irregular-verb forms) **before** looking at the
existing value, then compared. `verbs.ts` was NOT edited by this plan —
corrections (if any) happen in Plan 02 after user sign-off.

**Method notes:**
- Regular endings applied by class:
  - `-ar`: pres `-o/-as/-a/-amos/-am/-am`; pret `-ei/-aste/-ou/-ámos/-aram/-aram`
    (EP retains the acute accent on the nós-preterite to distinguish it from
    the nós-present, e.g. `falámos` vs `falamos`); imperf
    `-ava/-avas/-ava/-ávamos/-avam/-avam`; fut
    `-arei/-arás/-ará/-aremos/-arão/-arão`.
  - `-er`: pres `-o/-es/-e/-emos/-em/-em`; pret
    `-i/-este/-eu/-emos/-eram/-eram`; imperf
    `-ia/-ias/-ia/-íamos/-iam/-iam`; fut `-erei/-erás/-erá/-eremos/-erão/-erão`.
  - `-ir`: pres `-o/-es/-e/-imos/-em/-em`; pret
    `-i/-iste/-iu/-imos/-iram/-iram`; imperf
    `-ia/-ias/-ia/-íamos/-iam/-iam`; fut `-irei/-irás/-irá/-iremos/-irão/-irão`.
  - Orthographic stem adjustments checked where applicable: `-car` → `qu`
    before `e` (e.g. `ficar` → `fiquei`), `-gar` → `gu` before `e` (e.g.
    `chegar` → `cheguei`, `pagar` → `paguei`, `jogar` → `joguei`). No `-çar`
    verbs are present in this dataset.
- `voces` and `eles_elas` are both 3rd-person-plural forms in this app's
  vocabulary — identical strings across these two keys are EXPECTED and are
  NOT discrepancies (per plan `<interfaces>` note).
- Irregular verbs were re-derived from known EP irregular paradigms (present,
  irregular preterite stems, imperfect, future), not from the regular
  templates above.

---

## Regular verbs

38 verbs in `verbs.ts` are flagged `isIrregular: false`. All 38 were
independently re-derived across all 4 tenses × 6 subjects (912 cells total).

### Discrepancies

None found.

### Verbs checked, no discrepancies (38/38 — full coverage)

| # | Verb | Class | Cells checked | Result |
|---|------|-------|----------------|--------|
| 1 | falar | -ar | 24 | clean |
| 2 | comer | -er | 24 | clean |
| 3 | partir | -ir | 24 | clean |
| 4 | gostar | -ar | 24 | clean |
| 5 | morar | -ar | 24 | clean |
| 6 | trabalhar | -ar | 24 | clean |
| 7 | estudar | -ar | 24 | clean |
| 8 | comprar | -ar | 24 | clean |
| 9 | chegar | -ar (g→gu) | 24 | clean |
| 10 | ficar | -ar (c→qu) | 24 | clean |
| 11 | achar | -ar | 24 | clean |
| 12 | precisar | -ar | 24 | clean |
| 13 | usar | -ar | 24 | clean |
| 14 | entrar | -ar | 24 | clean |
| 15 | pagar | -ar (g→gu) | 24 | clean |
| 16 | ajudar | -ar | 24 | clean |
| 17 | jogar | -ar (g→gu) | 24 | clean |
| 18 | chamar | -ar | 24 | clean |
| 19 | passar | -ar | 24 | clean |
| 20 | levar | -ar | 24 | clean |
| 21 | beber | -er | 24 | clean |
| 22 | aprender | -er | 24 | clean |
| 23 | viver | -er | 24 | clean |
| 24 | correr | -er | 24 | clean |
| 25 | escrever | -er | 24 | clean |
| 26 | receber | -er | 24 | clean |
| 27 | vender | -er | 24 | clean |
| 28 | resolver | -er | 24 | clean |
| 29 | bater | -er | 24 | clean |
| 30 | prometer | -er | 24 | clean |
| 31 | abrir | -ir | 24 | clean |
| 32 | decidir | -ir | 24 | clean |
| 33 | dividir | -ir | 24 | clean |
| 34 | assistir | -ir | 24 | clean |
| 35 | permitir | -ir | 24 | clean |
| 36 | imprimir | -ir | 24 | clean |
| 37 | insistir | -ir | 24 | clean |
| 38 | querer | -er* | 24 | clean (see note below) |

**Note on `querer` (verb #38):** `querer` is flagged `isIrregular: false` in
`verbs.ts`, but its actual EP present indicative `ele_ela` form is `quer`
(not the mechanically-regular `*quere`), and its preterite is a fully
irregular strong stem (`quis/quiseste/quis/quisemos/quiseram/quiseram`, not
the regular `*queri/*quereste/...`). Independently re-deriving `querer` from
its true EP paradigm (rather than the plain `-er` template) produces exactly
the strings already in `verbs.ts` — so there is **no conjugation-string
discrepancy** to report. However, per Phase 2 D-05's own criterion
("`isIrregular` is true iff the verb deviates from the regular pattern in the
present indicative specifically"), `querer`'s present-indicative `quer` (vs.
regular `*quere`) appears to meet that deviation bar, which would suggest its
`isIrregular` flag may be mis-set to `false`. Per this plan's explicit scope
("do NOT second-guess irregularity classification, only conjugation
strings"), this is flagged as an **observation only**, not a discrepancy row,
and is not corrected here. Flagging for user awareness / Plan 02 discussion.

---

## Irregular verbs

12 verbs in `verbs.ts` are flagged `isIrregular: true`. All 12 were
independently re-derived across all 4 tenses × 6 subjects (288 cells total)
from their known EP irregular paradigms.

### Discrepancies

None found.

### Verbs checked, no discrepancies (12/12 — full coverage)

| # | Verb | Cells checked | Result |
|---|------|----------------|--------|
| 39 | ser | 24 | clean |
| 40 | estar | 24 | clean |
| 41 | ter | 24 | clean |
| 42 | ir | 24 | clean |
| 43 | fazer | 24 | clean |
| 44 | poder | 24 | clean |
| 45 | dizer | 24 | clean |
| 46 | ver | 24 | clean |
| 47 | dar | 24 | clean |
| 48 | vir | 24 | clean |
| 49 | saber | 24 | clean |
| 50 | pôr | 24 | clean |

**Low-confidence flags:** None. Every cell re-derived from a well-established
EP irregular paradigm at high confidence.

**Notable irregular-pattern points double-checked (no discrepancy, listed for
auditability):**
- `ser`/`ir` share an identical preterite (`fui/foste/foi/fomos/foram/foram`)
  — verified against `verbs.ts`, both entries match and are internally
  consistent with each other.
- `ver`'s present `nós`/3rd-plural forms use post-1990-orthographic-agreement
  spelling (`veem`, no circumflex) rather than the pre-reform `vêem` — matches
  `verbs.ts`.
- `pôr`'s future stem is `por-` (not `pôr-`) — `porei/porás/porá/poremos/
  porão/porão` — matches `verbs.ts`.
- `poder`'s preterite `ele_ela` form `pôde` (circumflex) vs. `pode` (present,
  no circumflex) — both correctly distinguished in `verbs.ts`.
- `dar`'s imperfect (`dava/davas/dava/dávamos/davam/davam`) and `saber`'s
  imperfect/future are actually regular in form (only present/preterite are
  irregular for these verbs) — matches `verbs.ts`, consistent with D-05's
  present-indicative-only classification criterion.

---

## Summary

- **Total verbs checked:** 50 / 50 (100% coverage — every verb in `verbs.ts`
  appears in a clean-coverage list above; none silently omitted)
- **Total cells re-derived:** 1,200 / 1,200 (50 verbs × 4 tenses × 6 subjects)
- **Total discrepancies found:** 0
- **Total low-confidence flags:** 0
- **Observational note (non-discrepancy):** `querer`'s `isIrregular: false`
  classification may be worth re-examining against Phase 2 D-05's own
  present-indicative-deviation criterion (see note under verb #38 above).
  This is a classification question, not a conjugation-accuracy discrepancy,
  and is explicitly out of scope for this plan per its `<read_first>`
  instruction not to second-guess irregularity classification.
- **`src/dataset/verbs.ts` modified by this plan:** No. `git diff --stat
  src/dataset/verbs.ts` is empty.

**Conclusion:** The full 50-verb dataset's conjugation cells are accurate
against independently re-derived European Portuguese grammar rules. This is
a clean verification pass — no corrections are required going into Plan 02,
though the user may still want to spot-check the `querer` classification
observation above.
