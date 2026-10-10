const $ = (id) => document.getElementById(id);
const form = $('form');

function render(summary) {
  const box = $('summary');
  box.textContent = '';
  let list = null;
  for (const line of summary.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (/^[-*•]\s+/.test(line)) {
      if (!list) { list = document.createElement('ul'); box.appendChild(list); }
      const li = document.createElement('li');
      li.textContent = line.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '');
      list.appendChild(li);
    } else {
      list = null;
      const p = document.createElement('p');
      p.textContent = line.replace(/\*\*/g, '');
      box.appendChild(p);
    }
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').hidden = true;
  $('result').hidden = true;
  $('loading').hidden = false;
  $('btn').disabled = true;

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: $('url').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    $('title').textContent = data.title;
    render(data.summary);
    $('note').hidden = !data.truncated;
    $('result').hidden = false;
  } catch (err) {
    $('error').textContent = err.message;
    $('error').hidden = false;
  } finally {
    $('loading').hidden = true;
    $('btn').disabled = false;
  }
});
