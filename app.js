require('dotenv').config();
const path = require('path');
const express = require('express');
const { scrape } = require('./lib/scrape');
const { summarize } = require('./lib/summarize');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/summarize', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Please provide a URL.' });
    }
    const { title, text, truncated } = await scrape(url.trim());
    const summary = await summarize(title, text);
    res.json({ title, summary, truncated });
  } catch (err) {
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong.' });
  }
});

module.exports = app;
