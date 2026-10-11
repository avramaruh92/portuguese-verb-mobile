# Phase 38: App Store Release & Oregon Gate Hand-back - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 38-app-store-release-oregon-gate-hand-back
**Areas discussed:** What's New text, Listing & notes refresh, Rejection / delay plan, Oregon hand-back timing

---

## What's New text

| Option | Description | Selected |
|--------|-------------|----------|
| Speed + reliability | "Faster, more reliable loading of quiz content. Small stability improvements." | ✓ |
| Generic bug fixes | "Bug fixes and performance improvements." | |
| Mention the server move | "Lafa now uses a server in Europe..." | |

| Option | Description | Selected |
|--------|-------------|----------|
| store/metadata/whats-new.txt | New versioned source file, copied verbatim into ASC | ✓ |
| Only in submission-log.md | No separate file | |

**User's choice:** Speed + reliability (preview text verbatim), stored in `store/metadata/whats-new.txt`.

---

## Listing & notes refresh

| Option | Description | Selected |
|--------|-------------|----------|
| Update device line only | Change Devices/OS tested to iPhone 14 Pro, iOS 27.0.1 | ✓ |
| Device line + version-change note | Also add a "1.0.1 changes only backend host" paragraph | |
| Leave as-is | Submit current notes | |

| Option | Description | Selected |
|--------|-------------|----------|
| Carry forward unchanged | Log records "unchanged from 1.0.0" | ✓ |
| Re-verify each field in ASC | Per-field check like 1.0.0 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Append '# Lafa v1.0.1' section | Single multi-version log file | ✓ |
| Separate file per version | Conflicts with REL-03 path | |

---

## Rejection / delay plan

| Option | Description | Selected |
|--------|-------------|----------|
| Reply in Resolution Center first | Same build; rebuild only for a cited binary defect | ✓ |
| Always rebuild on rejection | New build #9+ every time | |

| Option | Description | Selected |
|--------|-------------|----------|
| Phased release off | All users at once, fastest Oregon drain | ✓ |
| Phased release on | 7-day rollout | |

| Option | Description | Selected |
|--------|-------------|----------|
| Hold until live; flag at 10-27 | Interim backend warning if not live by 10-27 | ✓ |
| Recommend deletion on 10-30 regardless | Delete even if 1.0.1 not live | |

---

## Oregon hand-back timing

| Option | Description | Selected |
|--------|-------------|----------|
| As soon as it's live | Append on Ready for Distribution day; backend runs the clock | ✓ |
| After the 48h quiet window | Mobile watches traffic, phase stays open | |

| Option | Description | Selected |
|--------|-------------|----------|
| Backend owns it | Backend checks Oregon logs, excluding keep-warm pings | ✓ |
| Mobile records an observation | Baseline of the last real Oregon request in the status line | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, one sentence | 1.0.0 non-updaters caveat + graceful fallback | ✓ |
| No, keep it to the rule | Rule only | |

---

## Claude's Discretion

- Exact wording of the device line, the interim slip line and the HAND-02 status line.
- Plan split across the Apple review wait and checkpoint structure.

## Deferred Ideas

None.
