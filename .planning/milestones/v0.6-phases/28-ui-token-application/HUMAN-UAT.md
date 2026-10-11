# Phase 28 — Human UAT

**Status: APPROVED by developer, 2026-08-15.**

Consolidated from `checkpoint:human-verify` tasks deferred during execution
(`workflow.human_verify_mode = end-of-phase`, the project default).

## Pressed-state visuals (from 28-02, Task 4)

**What was built:** Pressed-state backgrounds (`colors.pressed`, deep orange
`#C94A2D`) on the Setup Start Quiz button, Quiz choice buttons (unanswered
only), Quiz Next button, Results Share Score / Try Again buttons, and (from
28-03) both feedback modals' Submit and Retry buttons — all via `Pressable`'s
function-form `style` prop. The Setup "Lafa" heading was confirmed unchanged
(text-only).

**How to verify:**
1. Run `npm run ios` and open the app.
2. Setup screen: press and HOLD "Start Quiz" — the button background should
   darken to deep orange while held, and return to `#F2643E` on release.
   Confirm the "Lafa" heading is plain text with no icon.
3. Press and hold a tense chip and the verb-mode chips — they must NOT
   change color (out of scope by design).
4. Start a quiz. Press and hold an answer choice WITHOUT releasing — the
   choice should darken to deep orange. Release to lock it in.
5. With a choice now locked (green/red showing), press and hold any choice
   again — the green/red coloring must NOT be replaced by deep orange.
6. Press and hold "Next" — should darken to deep orange.
7. Finish the quiz. On Results, press and hold "Share Score" and "Try Again"
   — both should darken to deep orange. Press and hold "Back to Setup" —
   it must NOT change color (out of scope by design).
8. Trigger the "Report a problem" modal from a quiz question and the product
   feedback modal (if separately accessible) — press and hold each modal's
   Submit button (darkens to deep orange) and, if a submission error is
   forced, the Retry button (also deep orange).

**Also confirm the OfflinePill (from 28-01):** if the app falls back to local
content (or force this by disabling network), the "Using saved content" pill
should render with a teal tint background and teal text, not the old orange.

**Acceptance criteria:**
- Start Quiz, Next, Share Score, Try Again, and both modals' Submit/Retry
  each visibly darken while held and revert on release
- An unanswered quiz choice darkens while held
- A locked quiz choice retains its success/error color while held (no orange
  override)
- Setup chips and the Results "Back to Setup" link show no pressed color
  change
- The Setup "Lafa" heading renders as text only, no icon or oversized
  display type
- OfflinePill (when shown) is teal-tinted, not orange

**Resume signal:** Type "approved" or describe which element behaved
incorrectly.
