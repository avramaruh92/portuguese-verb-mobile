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

**Date entered:** 2026-08-17

**Data Collection screen:** "Yes, we collect data from this app"

**Data type declared:** User Content only. No other Apple data type category checked.

**Discrepancy from `store/privacy/nutrition-label-answers.md` §3 (recorded, not a divergence
in the actual answer — a discrepancy in the *sheet's assumed UI flow*):** the sheet assumed
a single either/or choice between "User Content -> Customer Support" and
"User Content -> Other User Content." The live App Store Connect questionnaire instead
presented **both** sub-type screens in sequence (Customer Support, then Other User Content)
rather than one exclusive choice. For each screen entered:

| Sub-type screen | Purpose selected | Other purposes |
|---|---|---|
| Customer Support | App Functionality | Third-Party Advertising, Developer's Advertising/Marketing, Analytics, Product Personalization, Other Purposes — all left unchecked |
| Other User Content | App Functionality | Same as above — all left unchecked |

**Linked to identity:** "Data Not Linked to You" (no login, no accounts, no device ID, no IP
collected or retained anywhere — consistent with `CLAUDE.md` "Auth Model: None" and the D-13
backend fix recorded in the answer sheet §4).

**Tracking:** "No, we do not use other user content for tracking purposes" (answered on the
final Other User Content tracking screen).

**User-Generated Content / Social Media question:** answered **No** to both parts. Rationale
given: the app's Share button only invokes the native OS share sheet with the user's own
score text — there is no in-app redistribution, feed, or content-discovery surface.

**Developer confirmed:** saved in App Store Connect.

**Follow-up applied:** `store/privacy/nutrition-label-answers.md` §3 was corrected to reflect
that the live UI presents both User Content sub-type screens in sequence (not an either/or) —
see that file's "Correction (live-verified at execution time, plan 35-07)" note.

## Age Rating

Questionnaire completed and saved, walked live question by question per plan instructions
(no shortcuts reported).

**Resulting tier:** **4+** — confirmed by the developer, matching the expected outcome. No
question drove a higher tier; no unusual question was reported.

## Export Compliance

**Result:** No prompt appeared for this version. Apple auto-resolved the export compliance
answer from `expo.ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `app.json`,
consistent with expectations — no manual "No" answer was required.

**Task 2 status: COMPLETE.** App Privacy, Age Rating (4+), and Export Compliance are all
recorded and confirmed by the developer.

## Submitted for Review

**Confirmed:** the developer clicked "Submit for Review" and Lafa v1.0.0 (build #6, EAS build
id `a89da11a-b874-41d8-9184-06a18033b1eb`) is now submitted to Apple App Review.

**Not explicitly captured:** the exact App Store Connect status string (e.g. "Waiting for
Review" vs "In Review"), the precise submission timestamp, and which release option (manual
release after approval vs automatic release) was chosen were not reported back verbatim by
the developer/coordinator. Recorded here as a minor gap rather than assumed — if this needs
closing out precisely, re-check the version's status page in App Store Connect.

**Two blockers encountered and resolved immediately before the successful submit:**

1. **App Privacy not "Published."** ASC initially blocked submission with: "Before you can
   submit this app for review, an Admin must provide information about the app's privacy
   practices in the App Privacy section." Root cause: the App Privacy questionnaire
   sub-screens (data type, purpose, linkage, tracking — see `## App Privacy` above) had all
   been filled out and saved, but never explicitly "Published" via the separate top-level
   App Information -> App Privacy tab's **Publish** button, which is a distinct action from
   saving the individual questionnaire screens. **Fix:** the developer went back to that tab
   and clicked Publish, which resolved the block.
2. **Pricing not set.** Price was set to **$0.00 (Free)** at the same time — a required
   field that had not yet been addressed by any prior task in this plan.

**Content Rights:** answered **"No, it does not contain, show, or access third-party
content"** — the verb dataset is hand-authored by the project, not third-party or licensed
content.

**Task 3 status: COMPLETE.** Lafa v1.0.0 is submitted for App Review. This is the terminal
action of the v1.0 milestone and of Phase 35.
