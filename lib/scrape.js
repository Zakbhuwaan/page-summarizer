const cheerio = require('cheerio');

const MAX_CHARS = 12000;

function validateUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(400, 'Please enter a valid URL (including http:// or https://).');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new HttpError(400, 'Only http and https URLs are supported.');
  }
  const host = url.hostname;
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) ||
    host === '[::1]'
  ) {
    throw new HttpError(400, 'Private or local addresses are not allowed.');
  }
  return url;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function scrape(rawUrl) {
  const url = validateUrl(rawUrl);

  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PageSummarizerBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new HttpError(502, 'Could not reach that URL. Check the address and try again.');
  }

  if (!res.ok) throw new HttpError(502, `The page responded with status ${res.status}.`);
  const type = res.headers.get('content-type') || '';
  if (!type.includes('html')) throw new HttpError(415, 'That URL does not look like an HTML page.');

  const $ = cheerio.load(await res.text());
  const title = $('title').first().text().trim() || $('h1').first().text().trim() || url.hostname;

  $('script, style, noscript, nav, footer, header, aside, form, iframe, svg').remove();

  $('br, p, h1, h2, h3, h4, h5, h6, li, div, tr, td').after(' ');

  const root = $('article').first().length ? $('article').first()
    : $('main').first().length ? $('main').first()
    : $('body');

  const text = root.text().replace(/\s+/g, ' ').trim();
  if (text.length < 100) {
    throw new HttpError(422, 'Not enough text found. The page may rely on JavaScript to render.');
  }

  return { title, text: text.slice(0, MAX_CHARS), truncated: text.length > MAX_CHARS };
}

module.exports = { scrape, HttpError };
