No login by design. There is no account, no sign-up, no sign-in, and no
session anywhere in the app. No demo credentials are needed or can be
provided. Nothing in the app is gated, paywalled, or hidden behind any
unlock - every screen and every feature is reachable immediately from a
cold launch.

How to exercise the full app in under a minute: launch the app; on the
Setup screen select one or more tenses and a verb mode; tap Start; answer
any of the 10 multiple-choice questions (an explanation appears after each
answer); reach the Results screen for the score.

Network use - the app makes exactly three outbound calls, all to
https://portuguese-verb-api.onrender.com:

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

No other network requests are made. No analytics, advertising, tracking,
or crash-reporting SDK is present, and no personal data or device
identifier is collected.

Backend note: the API is hosted on Render's free tier and may cold-start.
If the content fetch is slow on the reviewer's first launch, the app falls
back to bundled content rather than blocking, so the quiz still works.

Language note: the content is European Portuguese (Portugal), not
Brazilian Portuguese - conjugations that may look unfamiliar to a
Brazilian Portuguese speaker (for example the "vocês" form used in place
of "vós") are intentional.

Contact: aruhicen@gmail.com
