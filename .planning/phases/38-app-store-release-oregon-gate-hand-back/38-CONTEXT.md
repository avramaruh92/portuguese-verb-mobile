# Phase 38: App Store Release & Oregon Gate Hand-back - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Submit the already-built and device-verified Lafa 1.0.1 (build 8, EAS build
`c5c481e4-4ebe-49ea-a32a-7ef76ca87563`, ASC status "Ready to Submit") to App
Review with Frankfurt review notes, "What's New" text and automatic release;
record every ASC status transition verbatim in `store/submission-log.md`; once
it is Ready for Distribution, record the live date and append the Oregon-deletion
gate recommendation to the backend handoff (REL-03, REL-04, HAND-02).

No app code changes. The only repo edits are store metadata/log files and the
backend's `docs/mobile-handoff.md`. App Store Connect actions and the Apple
review wait are operator-driven (human checkpoints). Target live ~2026-10-17;
Oregon deletion no later than 2026-10-30; hard deadline 2026-11-01.

</domain>

<decisions>
## Implementation Decisions

### What's New text
- **D-01:** The 1.0.1 "What's New" text is exactly:
  `Faster, more reliable loading of quiz content. Small stability improvements.`
  It is user-facing benefit framing. It does not mention servers, Frankfurt or regions.
- **D-02:** Source of truth is a new file `store/metadata/whats-new.txt`,
  following the `subtitle.txt`/`keywords.txt` pattern. It is entered verbatim
  into ASC, and the submission log records that it matches the file.

### Listing & review notes
- **D-03:** In `store/metadata/review-notes.md`, update only the "Devices/OS
  tested" line to reflect the 1.0.1 verification (iPhone 14 Pro, iOS 27.0.1,
  per 37-EVIDENCE.md E2E-01..04). The rest is already Frankfurt-correct from
  Phase 36 and stays as is, with no added "what changed in 1.0.1" paragraph.
  Paste the updated notes into ASC App Review Information.
- **D-04:** Carry the rest of the listing forward unchanged from 1.0.0
  (subtitle, keywords, description, category, URLs, screenshots, privacy
  label, age rating, pricing). There is no UI or data-collection change. The
  log records "unchanged from 1.0.0" rather than re-entering each field.
- **D-05:** `store/submission-log.md` becomes the multi-version history.
  Retitle it to "Submission Log — Lafa", keep the 1.0.0 content, and append a
  `# Lafa v1.0.1` section. Record each ASC status string verbatim with a UTC
  timestamp (e.g. Prepare for Submission → Waiting for Review → In Review →
  Pending Developer Release/Ready for Distribution), plus the release option
  chosen and the attached build (8 / EAS id). This closes the 1.0.0 log's gap,
  where status strings, timestamps and release option were not captured.

### Rejection / delay plan
- **D-06:** For an info request (like 1.0.0's Guideline 2.1) or a
  metadata-only rejection, reply in Resolution Center and resubmit the same
  build 8. Only a rejection that cites a binary defect triggers a rebuild
  (build #9+), which becomes a gap-closure plan. Every Apple message and reply
  is recorded verbatim in the submission log.
- **D-07:** Release option is "Automatically release this version" with
  **phased release OFF**, so all users get it at once and 1.0.0 installs drain
  off Oregon as fast as possible.
- **D-08:** Slip handling: the gate rule is unchanged (deletion requires
  1.0.1 live). If 1.0.1 is not live by **2026-10-27**, append an interim status
  line to the backend handoff warning that the 10-30 target is at risk and the
  11-01 hard deadline is approaching, then let the backend decide. Mobile does
  NOT recommend deleting Oregon before 1.0.1 is live.

### Oregon hand-back
- **D-09:** Append the HAND-02 status line as soon as 1.0.1 shows Ready for
  Distribution, on the same day. Phase 38 closes then and does not wait out
  the 48h window.
- **D-10:** The backend owns the "no real Oregon requests" judgment: it checks
  Oregon service logs, excluding its own keep-warm pings, and runs the deletion
  clock. Mobile states the rule and does not record a traffic baseline.
- **D-11:** The status line includes a one-sentence caveat. 1.0.0 installs
  without auto-update keep calling Oregon until they update. After deletion,
  they fall back to bundled content and feedback fails gracefully with Retry,
  as verified offline in Phase 37 E2E-04.
- **D-12:** Status line format mirrors the HAND-01 line in Phase 37
  (`**Status YYYY-MM-DD (mobile):** ...`), appended to the same 2026-10-09
  entry in `../portuguese-verb-backend/docs/mobile-handoff.md`, as a
  single-file backend commit that bumps `last_updated`. Content: version/build,
  live date, recommendation "delete Oregon once 1.0.1 is live AND (~48h of no
  real Oregon requests OR 2026-10-30), whichever comes first", plus the D-11
  caveat.

### Claude's Discretion
- Exact wording of the D-03 device line, the D-08 interim line and the D-12
  status line, within the constraints above.
- How plans split across the review wait (e.g. submit plan → wait/record plan
  → hand-back plan) and the checkpoint structure.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/ROADMAP.md` § Phase 38: goal, success criteria, operator checkpoints
- `.planning/REQUIREMENTS.md`: REL-03, REL-04, HAND-02; hard deadline 2026-11-01; out-of-scope "Keeping an Oregon fallback in 1.0.1"

### Prior release evidence
- `.planning/phases/37-1-0-1-build-testflight-device-verification/37-EVIDENCE.md`: build 8 / EAS id, ASC "Ready to Submit", device + iOS 27.0.1, E2E-04 offline evidence, exact HAND-01 status line format
- `store/submission-log.md`: 1.0.0 log (structure to extend; the known ASC blockers App Privacy "Publish" and Pricing; the recorded gap in status/timestamp/release-option capture)

### Store metadata
- `store/metadata/review-notes.md`: Frankfurt review notes (device line to update)
- `store/metadata/subtitle.txt`, `store/metadata/keywords.txt`: file pattern for the new `whats-new.txt`
- `store/README.md`: store directory conventions

### Backend handoff
- `../portuguese-verb-backend/docs/mobile-handoff.md` § "2026-10-09 — API base URL moved to Frankfurt": target entry for the HAND-02 line (and any D-08 interim line)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None needed. This phase changes no `src/` or `app/` code. Optional sanity check: `npm run preflight` against Frankfurt before submitting.

### Established Patterns
- Store metadata as plain-text source-of-truth files under `store/metadata/`, copied verbatim into ASC, with divergences recorded in the submission log.
- Evidence and log documents must contain no Apple ID, tester email, UDID, credentials or API keys (37-EVIDENCE.md rule).
- Backend handoff is updated by appending dated `**Status ... (mobile):**` lines in a single-file commit in the sibling repo.

### Integration Points
- App Store Connect (operator): version 1.0.1 page, What's New, App Review Information, build selection, release option, Submit for Review.
- Sibling repo `portuguese-verb-backend` (branch main): `docs/mobile-handoff.md`.

</code_context>

<specifics>
## Specific Ideas

- What's New preview the user approved verbatim: "Faster, more reliable loading of quiz content. Small stability improvements."
- 1.0.0 needed a Guideline 2.1 info request and a resubmission, so plan for that path, not just the happy path.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within phase scope.

</deferred>

---

*Phase: 38-app-store-release-oregon-gate-hand-back*
*Context gathered: 2026-10-11*
