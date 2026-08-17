# store/

Versioned App Store Connect listing source copy. This directory has zero
code coupling: nothing under `store/` is imported by any build tool, and
`eas.json` does not reference it. Every file here is transcribed by hand
into the App Store Connect web UI at submission time.

| File | App Store Connect field |
|------|--------------------------|
| `metadata/subtitle.txt` | App Information -> Subtitle |
| `metadata/keywords.txt` | App Information -> Keywords |
| `metadata/category.md` | App Information -> Category (primary/secondary) |
| `metadata/description.md` | Version Information -> Description |
| `metadata/review-notes.md` | App Review Information -> Notes |
