# Phase 11: Lafa Design Tokens & Brand Identity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 11-Lafa Design Tokens & Brand Identity
**Areas discussed:** Lafa palette values, Token key strategy, Typography & spacing changes, App name/identity scope

---

## Lafa palette values

**Q1: Do you have the Lafa design doc's actual color hex values to share, or should I propose a palette?**

| Option | Description | Selected |
|--------|-------------|----------|
| I'll paste the doc's values | You have the doc content and will share hex values | |
| Propose a palette for me | No doc values on hand — propose a cohesive palette | ✓ |
| Doc has partial info | Share what you have, I'll fill gaps | |

**User's choice:** Propose a palette for me
**Notes:** The Codex-authored external design doc referenced in PROJECT.md was not available/on-hand for this discussion.

**Q2: What visual mood should the Lafa palette lean toward?**

| Option | Description | Selected |
|--------|-------------|----------|
| Warm & friendly | Warm coral/orange or teal, soft rounded feel | ✓ |
| Calm & minimal | Muted blue/green, low-saturation, editorial | |
| Bold & energetic | Saturated single accent, higher contrast | |

**User's choice:** Warm & friendly

**Q3: Any specific brand color already associated with "Lafa"?**

| Option | Description | Selected |
|--------|-------------|----------|
| No, pick something new | No existing constraint | ✓ |
| Yes, I'll specify a hue/color | User has a specific color in mind | |

**User's choice:** No, pick something new

**Q4: Proposed warm/friendly Lafa palette — approve, or pick an alternate primary hue?**

| Option | Description | Selected |
|--------|-------------|----------|
| Coral/terracotta primary | primary #E8663D, primarySoft #FCE4DA, success #2FA84F, error #D64545, text #1C1B1A, textSecondary #6B6560 | ✓ |
| Warm amber/gold primary | primary #D9A441, primarySoft #FBF0DA, same neutrals | |
| Deep teal primary | primary #1E7F7A, primarySoft #DCF0EE, same neutrals | |

**User's choice:** Coral/terracotta primary
**Notes:** Locked as D-01 in CONTEXT.md.

---

## Token key strategy

**Q1: Rename existing keys or add new keys alongside old ones?**

| Option | Description | Selected |
|--------|-------------|----------|
| Rename in place | accent→primary, secondary→primarySoft, no dead keys | ✓ |
| Additive | Keep old + new, more risk of missed call sites | |

**User's choice:** Rename in place

**Q2: Radius tokens — rename `control` or add a new `pill` radius?**

| Option | Description | Selected |
|--------|-------------|----------|
| Add `pill` alongside `control` | Keep control (12), add pill for OfflinePill | ✓ |
| Single radius scale with more steps | sm/md/pill — more than needed | |

**User's choice:** Add `pill` alongside `control`

**Q3: Renaming `secondary` (#F2F2F7 gray) to `primarySoft` would coral-tint neutral surfaces (input fields, reason-picker buttons). Keep those neutral instead?**

| Option | Description | Selected |
|--------|-------------|----------|
| Add a `surface` neutral gray token | primarySoft reserved for OfflinePill only, new surface token for neutral backgrounds | ✓ |
| Use primarySoft everywhere secondary was used | Simpler but tints inputs/buttons coral, beyond BRAND-02/04 wording | |

**User's choice:** Add a `surface` neutral gray token
**Notes:** Locked as D-01/D-03 in CONTEXT.md — `surface: "#F2F2F1"`.

---

## Typography & spacing changes

**Q1: Does the design doc change font sizes/weights, or is this phase colors/radius only?**

| Option | Description | Selected |
|--------|-------------|----------|
| Typography unchanged | Current type ramp stays as-is | ✓ |
| Adjust weights/sizes too | Expands phase scope | |

**User's choice:** Typography unchanged

**Q2: Does spacing scale need new values for this phase?**

| Option | Description | Selected |
|--------|-------------|----------|
| Unchanged | Current scale covers pill padding via `sm` | ✓ |
| Add new spacing value(s) | | |

**User's choice:** Unchanged

---

## App name/identity scope

**Q1: Anything besides expo.name + Setup heading that should change?**

| Option | Description | Selected |
|--------|-------------|----------|
| Just expo.name + Setup heading | Slug/scheme/repo stay unchanged per CLAUDE.md | ✓ |
| Also update other in-app text | Tell me where else the old name appears | |

**User's choice:** Just expo.name + Setup heading

**Q2 (follow-up, discovered during scan): `src/quiz/share.ts` also hardcodes "Portuguese Verb Quiz" in the native share message. In scope or defer?**

| Option | Description | Selected |
|--------|-------------|----------|
| Leave out of scope | Not named in BRAND-01..04, note as deferred | |
| Include it in this phase | Cheap, user-facing brand text | ✓ |

**User's choice:** Include it in this phase
**Notes:** Locked as D-09 in CONTEXT.md.

---

## Claude's Discretion

- Exact `radius.pill` numeric value (999 vs. computed half-height).
- Whether `surface` needs a dedicated text-on-surface color variant (default: reuse existing `text`/`textSecondary`).

## Deferred Ideas

None — all items raised during discussion were resolved into this phase's scope (see `src/quiz/share.ts` note above, which was pulled into scope rather than deferred).
