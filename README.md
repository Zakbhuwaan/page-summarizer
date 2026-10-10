# Page Summarizer

Paste a URL → the backend scrapes the page's main text → a free AI model (Groq, Llama 3.3 70B) returns a short summary, shown in the UI with a loading state.

- **Frontend:** plain HTML/CSS/JS in `public/`
- **Backend:** Node.js + Express (`app.js`), scraping with `cheerio` (`lib/scrape.js`), AI call in `lib/summarize.js`
- **AI:** [Groq](https://console.groq.com) free tier (no credit card)

The Express server serves the frontend **and** the `POST /api/summarize` endpoint, so there is one process to run, not two.

## Run locally

Requires Node.js 18+.

1. **Get a free Groq API key** at https://console.groq.com/keys
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create the `.env` file in the project root** (the same folder as `package.json`):
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set your key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
4. **Start the app** (frontend + backend)
   ```bash
   npm start
   ```
5. Open http://localhost:3000

`.env` is git-ignored; never commit your key.

## API

`POST /api/summarize` with `{ "url": "https://..." }` → `{ "title", "summary", "truncated" }`, or `{ "error" }` with a 4xx/5xx status.

## Deploy

**Vercel:** import the repo, add the `GROQ_API_KEY` environment variable, deploy. `vercel.json` and `api/index.js` route `/api/summarize` to the Express app and `public/` is served statically.

**Render / Railway / Fly.io:** create a Node web service, build command `npm install`, start command `npm start`, and set `GROQ_API_KEY`.

## Limits

- Only static HTML is scraped; JavaScript-rendered pages and bot-protected sites may fail with a clear error.
- Text is capped at ~12,000 characters before summarizing.
- Localhost/private-network URLs are rejected as basic SSRF protection (hostname checks only; it does not stop DNS tricks or redirects to private addresses).
