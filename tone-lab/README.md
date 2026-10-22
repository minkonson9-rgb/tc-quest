# TONE LAB

A Korean-language HSK 4 Mandarin tone practice app, built as a standalone static website.

Public entry: https://minkonson9-rgb.github.io/tc-quest/tone-lab/

## Features

- 598 unique HSK 2.0 Level 4 headwords, Korean glosses, numeric and marked pinyin.
- Five adaptive reading stages: three-choice, four-choice, tone entry, hanzi-only, and no meaning hint. Every ten adaptive answers, 8+ confident correct answers advance one stage and 4 or fewer reduce the stage.
- Listening practice, a 20-question challenge, weakness-weighted practice, and a separate tone-sandhi mode.
- Mistake review, uncertain-answer review, and spaced review after 1, 3, 7, 14, and 30 days.
- Searchable wordbook, favorites, flashcards, custom words, individual word notes, and selected usage examples.
- Tone accuracy statistics, confusion counts, seven-day activity, and streaks.
- Local microphone recordings for comparing with model audio. Recordings are never uploaded.
- Per-browser progress, JSON backup and restore, adjustable daily goals and speech speed.

## Run

Serve this folder with any static HTTP server. No build, backend, account, or API key is required. The parent repository is already configured for GitHub Pages.

Browser storage is local to each visitor and is not shared between devices. Backup and restore can transfer it. Pre-generated Mandarin audio covers all basic words and tone examples. Custom-word and example-sentence speech uses an installed Chinese voice. Recording requires browser microphone support and permission. Audio is synthesized, rather than a human recording.

Vocabulary uses dictionary tones for reading quizzes, and the listening and sandhi modes explicitly request the spoken tone pattern. This is an independent learning tool; it is not an official HSK product or a full HSK 3.0 syllabus. Multiple dictionary readings are possible for some words; each question uses the displayed Korean gloss and the chosen dictionary reading.

See THIRD_PARTY_NOTICES.md for vocabulary attribution and license.
