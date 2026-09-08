export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'StudyMate Gemini API is online.',
      hasKey: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is missing. Add it in Vercel and redeploy.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const prompt = String(body.prompt || '').trim();
    const system = String(
      body.system ||
        'You are StudyMate AI Tutor. Be clear, accurate, and structured.'
    );
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const models = [
      body.model,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
    ].filter(Boolean);

    let lastError = 'All model attempts failed';

    for (const model of models) {
      try {
        const url =
          'https://generativelanguage.googleapis.com/v1beta/models/' +
          encodeURIComponent(model) +
          ':generateContent?key=' +
          encodeURIComponent(key);

        const upstream = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: system + '\n\n' + prompt }] },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
        });

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
          lastError =
            (data && data.error && data.error.message) ||
            'Gemini failed for ' + model;
          continue;
        }

        const text =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;

        if (text) {
          return res.status(200).json({ text: text, model: model });
        }
        lastError = 'Empty response from ' + model;
      } catch (e) {
        lastError = e.message || String(e);
      }
    }

    return res.status(502).json({ error: lastError });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
                              }
