const { HttpError } = require('./scrape');

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

async function summarize(title, text) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new HttpError(500, 'Server is missing GROQ_API_KEY. See the README.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You summarize web pages. Reply with a 2-3 sentence overview, then 3-5 bullet points of key takeaways (each starting with "- "). Use only the provided content.',
        },
        { role: 'user', content: `Title: ${title}\n\nContent:\n${text}` },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 429) throw new HttpError(429, 'AI rate limit reached. Try again in a minute.');
  if (!res.ok) throw new HttpError(502, `AI service error (${res.status}).`);

  const data = await res.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new HttpError(502, 'AI returned an empty response.');
  return summary;
}

module.exports = { summarize };
