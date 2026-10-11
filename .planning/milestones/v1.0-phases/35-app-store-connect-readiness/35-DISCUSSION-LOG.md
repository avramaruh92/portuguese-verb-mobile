# Phase 35: App Store Connect Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 35-App Store Connect Readiness
**Areas discussed:** Support/Privacy URL hosting, Store listing copy & category, Privacy nutrition label answers, Screenshots approach

---

## Support/Privacy URL hosting

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Pages | Free, zero-maintenance, matches minimal-infra convention | ✓ |
| Existing backend domain | Reuse Render deploy for /privacy and /support routes | |
| Vercel/Netlify single page | Dedicated one-file static deploy | |

**User's choice:** GitHub Pages

| Option | Description | Selected |
|--------|-------------|----------|
| This repo (portuguese-verb-mobile) | Serve from a /docs folder or gh-pages branch on this repo | ✓ |
| New dedicated repo | Standalone repo just for these pages | |
| Something else | Free text | |

**User's choice:** This repo (portuguese-verb-mobile)

| Option | Description | Selected |
|--------|-------------|----------|
| Email link | mailto: link to a real checked inbox | ✓ |
| Link to in-app feedback flow | Describe existing POST /feedback channel instead of adding new one | |
| Both | Mention in-app channel AND fallback email | |

**User's choice:** Email link

| Option | Description | Selected |
|--------|-------------|----------|
| aruhicen@gmail.com | Known account email, reuse directly | ✓ |
| A new dedicated address | e.g. lafa.app@gmail.com, needs setup before submission | |

**User's choice:** aruhicen@gmail.com

**Notes:** No new infrastructure beyond enabling GitHub Pages on the existing repo.

---

## Store listing copy & category

| Option | Description | Selected |
|--------|-------------|----------|
| Education | Direct match for A1-A2 verb-conjugation quiz | ✓ |
| Reference | Fits a lookup/drill framing, less common for quiz apps | |
| Education + Reference secondary | Covers both discovery angles | |

**User's choice:** Education (single category)

| Option | Description | Selected |
|--------|-------------|----------|
| Direct & functional | Plain, keyword-forward, matches no-fluff design | ✓ |
| Warm/encouraging | Leans into Lafa brand voice | |
| You write it / I'll review | User drafts copy themselves | |

**User's choice:** Direct & functional

| Option | Description | Selected |
|--------|-------------|----------|
| Yes to all three (free / no-login / European Portuguese) | Reduces reviewer friction, pre-empts PT-PT vs PT-BR confusion | ✓ |
| Only European Portuguese distinction | Skip free/no-login in description copy | |
| You decide | Claude drafts using judgment | |

**User's choice:** Yes to all three

**Notes:** None further — user consistently picked the recommended, lower-effort option.

---

## Privacy nutrition label answers

| Option | Description | Selected |
|--------|-------------|----------|
| "Data Not Linked to You" — User Content | Honest middle ground for feedback text fields | ✓ |
| "Data Not Collected" | Riskier framing per research | |
| Need to verify against backend first | Don't lock now | |

**User's choice:** "Data Not Linked to You" — User Content (for POST /feedback + POST /product-feedback message content)

| Option | Description | Selected |
|--------|-------------|----------|
| Data Not Collected | Read-only GET, no body, no auth, no identifiers | ✓ |
| Flag for backend confirmation | Only declare after confirming backend log retention | |

**User's choice:** Data Not Collected (for GET /content/verbs)

| Option | Description | Selected |
|--------|-------------|----------|
| Flag as a research task before finalizing | Confirm actual backend retention/IP-logging via portuguese-verb-api repo before locking answers in App Store Connect | ✓ |
| Proceed with the assumption above | Lock in now without further backend verification | |

**User's choice:** Flag as a research task before finalizing

**Notes:** This is the one open item carried into CONTEXT.md as D-09 — researcher/planner must verify backend retention behavior before the nutrition label is entered live in App Store Connect.

---

## Screenshots approach

| Option | Description | Selected |
|--------|-------------|----------|
| Plain simulator captures | No captions/frames, matches "alpha-free" scope | ✓ |
| Simulator + simple text captions | Lightweight caption compositing for extra polish | |

**User's choice:** Plain simulator captures

| Option | Description | Selected |
|--------|-------------|----------|
| Setup, Quiz (mid-answer), Results | 3 screenshots covering the full core loop | ✓ |
| Same 3, plus Explanation panel | 4 screenshots, adds learning-content differentiator | |
| You decide at capture time | Don't lock exact set now | |

**User's choice:** Setup, Quiz (mid-answer), Results

| Option | Description | Selected |
|--------|-------------|----------|
| iOS Simulator, manual capture | iPhone 16 Pro Max (or equiv 6.9") simulator, manual capture | ✓ |
| Real device | Real 6.9" iPhone if available | |

**User's choice:** iOS Simulator, manual capture

**Notes:** None further.

---

## Claude's Discretion

- GitHub Pages exact folder structure and HTML/markdown wording for Support/Privacy pages
- Exact subtitle text (≤30 chars), full description copy, keyword list (≤100 chars)
- App Review "Notes" field wording
- `store/` directory internal layout (following architecture research's proposed `store/metadata|privacy|screenshots/` structure)
- Age rating questionnaire answers (not separately discussed — research suggests 4+, to be confirmed live in App Store Connect)

## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.
