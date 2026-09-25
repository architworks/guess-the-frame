# Guess the Movie

A local, shared-screen movie night built with Next.js, React and Gemini. Players guess aloud, type an answer, and pick who gets the point. No online multiplayer, fixed movie pool or AI feedback system.

## Run

```sh
npm install
# .env.local has already been created; add your API key there.
npm run dev
```

Open http://127.0.0.1:3000. If setting up a fresh checkout, copy `.env.example` to `.env.local` first.

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image-preview
```

These are the requested model IDs. Both are configurable; the app never switches models automatically. If Gemini reports an unavailable model, confirm the exact API model identifier available to your account and edit the corresponding env variable. Restart the server after env changes. API credentials stay server-side and env files are ignored by Git.

## How it works

- Add 1–8 player names, a free-text movie preference, rounds, hint allowance and a round timer (30 seconds, 1, 2, 3 or 5 minutes, or off). The editable preference starts with Bollywood films from 2000 onward.
- Gemini selects real movies freely and receives all previously selected titles and clue mechanisms, including upcoming cards. Prompts request varied genres, decades, prominence and visual mechanisms. Exact title/alias and year duplicates are rejected with up to three selection attempts.
- Text concepts are selected sequentially; image requests run asynchronously. The queue targets the current card plus three upcoming cards, and never exceeds the round count.
- A separate text call judges guesses against the private canonical title and aliases, accepting typos and transliterations. It can request a more specific title. Wrong guesses don't reveal the answer.
- The countdown defaults to 2 minutes and starts when the card image loads. It survives refreshes in this browser and stops at zero without forcing a reveal or blocking a final guess.
- Hints open progressively. A correct answer earns one point, assigned once by clicking a player. Revealing the answer awards no points.
- Setup, cards, images and scores persist locally in `.data/`. The browser stores a session ID so refreshes resume the game. Pending work resumes when the session reconnects after a server restart.
- Exit ends the session and prevents new generation. API requests already in flight may finish and still incur cost. Closing a tab lets the bounded queue finish; it does not generate an entire game.

This uses a long-running local Node server, not serverless hosting. No API key is needed to inspect setup, but starting a game requires a working Gemini key and access to both selected models. Live model quality and availability need validation with that key. The UI uses Google Fonts with local sans-serif fallbacks.

## Checks

```sh
npm test
npm run build
```

Tests mock the Gemini transport and exercise queue limits, unrevealed-answer privacy, incorrect/ambiguous guesses, hint limits, stale-card rejection, single-point awards, skipped rounds, completion and saved scores.
