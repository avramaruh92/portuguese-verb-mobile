# Submission Log — Lafa v1.0.0

Record of every value entered in App Store Connect for version 1.0.0, per plan 35-07. This
log is the audit trail tying the live listing back to the reviewed `store/` artifacts.

## Task 1: Listing metadata, URLs, category, screenshots, build

**Date entered:** 2026-08-17

**Pre-entry local verification (Claude, immediately before handoff):**
- Support URL `https://avramaruh92.github.io/portuguese-verb-mobile/support.html` -> `200`
- Privacy URL `https://avramaruh92.github.io/portuguese-verb-mobile/privacy.html` -> `200`
- `store/metadata/subtitle.txt` -> 25 characters (limit 30)
- `store/metadata/keywords.txt` -> 96 characters (limit 100)
- All three screenshots: `1320x2868`, `hasAlpha: no`

**Fields entered in App Store Connect (Lafa, version 1.0.0):**

| Field | Value entered |
|---|---|
| Subtitle | `European Portuguese verbs` |
| Keywords | `portuguese,european portuguese,verbs,conjugation,conjugator,quiz,grammar,language,practice,a1,a2` |
| Description | Full text of `store/metadata/description.md`, converted to plain text (headings/list markers stripped, line breaks and section order preserved) |
| Primary Category | Education |
| Secondary Category | None (left empty, per D-04) |
| Support URL | `https://avramaruh92.github.io/portuguese-verb-mobile/support.html` |
| Privacy Policy URL | `https://avramaruh92.github.io/portuguese-verb-mobile/privacy.html` |
| App Review Notes | Full text of `store/metadata/review-notes.md` |
| App Review Contact | aruhicen@gmail.com |
| Sign-in required | Not required (toggle off) |
| Screenshots (6.9-inch iPhone bucket) | `01-setup.png`, `02-quiz-locked.png`, `03-results.png`, in that order; no other device bucket used |
| Attached build | Build #6 (v1.0.0, EAS build id `a89da11a-b874-41d8-9184-06a18033b1eb`, per `35-06-SUMMARY.md`) |

**Divergence from `store/metadata/`:** None. The developer reported no Apple-forced
truncation, rejection, or edit to any field — every value above was entered and saved
exactly as it exists in the repo's `store/metadata/` files at entry time.

**Build processing status note:** `35-06-SUMMARY.md` had not yet recorded explicit
confirmation that build #6 finished Apple's server-side processing before this task
started. The developer was able to select and attach build #6 to the 1.0.0 version in App
Store Connect, which is only possible once a build has finished processing (Apple does not
offer a still-processing build for attachment) — this is treated as sufficient indirect
confirmation that processing completed, though no separate explicit "Ready to Submit"
status readout was captured verbatim in this log.

**Confirmation:** The developer confirmed all Task 1 fields (subtitle, keywords,
description, category, support URL, privacy URL, review notes, screenshots, build) were
entered and saved in App Store Connect. "Submit for Review" was NOT clicked.

## App Privacy

_Pending Task 2._

## Age Rating

_Pending Task 2._

## Export Compliance

_Pending Task 2._

## Submitted for Review

_Pending Task 3._
