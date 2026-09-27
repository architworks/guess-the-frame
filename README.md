# Guess the Movie

A shared-screen movie night built with Next.js, React and Gemini. Players guess aloud, type an answer, and pick who gets the point. There is no online multiplayer or fixed movie pool.

## Run locally

```sh
npm install
cp .env.example .env.local
# Add your Gemini API key to .env.local.
npm run dev
```

Open http://127.0.0.1:3000. Model IDs are configurable in `.env.local`:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```

## Deploy to Vercel

Deploy the repository as a Next.js app and set the three variables above in the Vercel project's environment settings. Redeploy after changing them. **No database, Blob store, or writable server filesystem is required.**

The Next.js API calls Gemini to create each puzzle and judge answers. Generated images are compressed before being returned to the browser, keeping each response below Vercel's 4.5 MB function payload limit. The API key stays on the server. The answer and hints travel in an authenticated, encrypted card token; changing `GEMINI_API_KEY` invalidates cards already stored in browsers.

The browser stores the game, images, scores and up to three upcoming cards in IndexedDB. It starts new generation requests while players guess the current card. A tab can be closed and reopened to resume; a pending or failed card is retried automatically on reopen. Browser storage can be cleared or evicted by the user, so games are local to one browser and device. Previous `.data/` sessions from the original local app are not migrated.

## Play

- Add players, adjust the editable movie preference, and choose rounds, hints and timer. The preference starts with Bollywood films from 2000 onward.
- The AI selects real films freely and uses encrypted tokens from all previous and queued cards to vary choices and reject duplicates within the game.
- Wrong guesses leave the answer hidden. Hints open progressively. A correct guess reveals the answer and can award one point to a selected player. Manual reveal awards no point.
- The countdown defaults to two minutes and starts when the image loads. At zero, players can still guess or reveal.

## Checks

```sh
npm test
npm run build
```
