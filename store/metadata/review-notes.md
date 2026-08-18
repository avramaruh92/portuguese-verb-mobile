Devices/OS tested before submission: iPhone 13 Pro (iOS 26.6) and iPhone 14
Pro (iOS 26.6). Screenshots were additionally captured on the iOS
Simulator (iPhone 17 Pro Max).

App description and target audience: Lafa is a verb-conjugation quiz app
for beginner (A1-A2) learners of European Portuguese. It targets
self-directed language learners who already have some vocabulary and want
focused, repeatable drilling on verb conjugation until the correct form
becomes automatic - it deliberately has no lessons, vocabulary lists, or
reading exercises. The problem it solves: conjugation drilling for
European (Portugal) Portuguese specifically is hard to find, since most
mainstream language apps default to Brazilian Portuguese. Lafa covers 4
tenses (present indicative, preterite, imperfect, future) across 6 subject
pronouns, with roughly 50 hand-verified verbs, and an option to include or
exclude irregular verbs.

No login by design. There is no account, no sign-up, no sign-in, and no
session anywhere in the app. No demo credentials are needed or can be
provided. Nothing in the app is gated, paywalled, or hidden behind any
unlock - every screen and every feature is reachable immediately from a
cold launch.

How to exercise the full app in under a minute: launch the app; on the
Setup screen select one or more tenses and a verb mode; tap Start; answer
any of the 10 multiple-choice questions (an explanation appears after each
answer); reach the Results screen for the score.

External services used: the app calls exactly one backend, an API the
developer operates, hosted on Render (https://portuguese-verb-api.onrender.com).
No third-party authentication, payment, analytics, advertising, tracking,
AI, or crash-reporting service is used anywhere in the app. The app makes
exactly three outbound calls, all to that one backend:

- GET https://portuguese-verb-api.onrender.com/content/verbs - fired once
  at launch to fetch quiz content. Sends no body, no credentials, no
  identifiers. If it fails or times out, the app silently falls back to a
  bundled offline dataset and shows a small "using saved content"
  indicator, so the app is fully usable with no connectivity.
- POST https://portuguese-verb-api.onrender.com/feedback - fired only when
  the user taps "Report a problem" on a quiz question and submits. Sends
  message, verb, tense, subject, correctAnswer, selectedAnswer, appVersion,
  platform.
- POST https://portuguese-verb-api.onrender.com/product-feedback - fired
  only when the user submits general product feedback. Sends category,
  message, screen, appVersion, platform.

No other network requests are made. No personal data or device identifier
is collected.

Backend note: the API is hosted on Render's free tier and may cold-start.
If the content fetch is slow on the reviewer's first launch, the app falls
back to bundled content rather than blocking, so the quiz still works.

Regional differences: the app functions identically in every region/App
Store territory - there is no region-gated feature or content. One
intentional content note: Lafa teaches European Portuguese as spoken in
Portugal, not Brazilian Portuguese, so some conjugations (for example the
"vocês" form used in place of "vós") may look unfamiliar to a Brazilian
Portuguese speaker. This is a deliberate scope choice, not a regional bug.

Regulated industry / protected third-party material: not applicable. The
app does not operate in a regulated industry (no health, finance,
gambling, etc.) and contains no third-party or licensed protected
material - the verb/conjugation dataset is original content, hand-authored
and verified by the developer.

Contact: aruhicen@gmail.com
